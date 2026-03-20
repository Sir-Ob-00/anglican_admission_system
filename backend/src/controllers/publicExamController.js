import Exam from "../models/Exam.js";
import ExamQuestion from "../models/ExamQuestion.js";
import ExamResult from "../models/ExamResult.js";
import Applicant from "../models/Applicant.js";
import EntranceExamSession from "../models/EntranceExamSession.js";
import { requireFields, safeTrim } from "../utils/validators.js";
import { gradeExam } from "../services/examService.js";
import { createNotification } from "../services/notificationService.js";
import { logActivity } from "../services/activityLogService.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import { Roles } from "../utils/roles.js";
import crypto from "crypto";

function escapeRegex(value) {
  return String(value || "").replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeApplicantName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function resolveEntranceExamAndApplicant({ examCode, applicantId, fullName }) {
  const exam = await Exam.findOne({ code: examCode }).lean();
  if (!exam) return { status: 404, message: "Entrance exam not found" };
  if (exam.status !== "active") return { status: 403, message: "Entrance exam is not published yet." };

  const baseFilter = {
    exam: exam._id,
    status: { $in: ["exam_scheduled", "exam_completed"] },
  };

  let applicant = null;
  const normalizedInputName = normalizeApplicantName(fullName);
  if (applicantId) {
    applicant = await Applicant.findOne({ ...baseFilter, _id: applicantId }).lean();
  } else {
    applicant = await Applicant.findOne({
      ...baseFilter,
      fullName: new RegExp(`^${escapeRegex(fullName)}$`, "i"),
    }).lean();

    if (!applicant) {
      const candidates = await Applicant.find(baseFilter).select("_id fullName").lean();
      applicant =
        candidates.find((item) => normalizeApplicantName(item.fullName) === normalizedInputName) || null;
    }
  }

  if (!applicant) {
    return {
      status: 403,
      message: "Applicant not assigned to this entrance exam (check Exam ID and full name).",
    };
  }

  if (applicantId && normalizeApplicantName(applicant.fullName) !== normalizedInputName) {
    return { status: 400, message: "Entered name does not match the assigned applicant." };
  }

  return { exam, applicant };
}

async function loadEntranceExamQuestions({ examId, questionOrder, shuffle = true, limit = 0 }) {
  const items = await ExamQuestion.find({ exam: examId }).select("-correctIndex").lean();
  const byId = new Map(items.map((item) => [String(item._id), item]));

  let ordered = [];
  if (Array.isArray(questionOrder) && questionOrder.length) {
    ordered = questionOrder.map((id) => byId.get(String(id))).filter(Boolean);
    const seen = new Set(ordered.map((item) => String(item._id)));
    ordered.push(...items.filter((item) => !seen.has(String(item._id))));
  } else {
    ordered = [...items];
    if (shuffle) ordered.sort(() => Math.random() - 0.5);
  }

  if (limit > 0) return ordered.slice(0, limit);
  return ordered;
}

async function blockEntranceExamSession(session, req, reason) {
  if (!session || session.status === "blocked") return session;

  session.status = "blocked";
  session.blockedAt = new Date();
  session.blockReason = safeTrim(reason || "Security check failed");
  session.currentIpAddress = req.ip;
  session.currentUserAgent = safeTrim(req.headers["user-agent"] || "");
  session.ipChangeEvents.push({
    ipAddress: req.ip,
    userAgent: safeTrim(req.headers["user-agent"] || ""),
  });
  await session.save();

  await logActivity({
    userId: null,
    action: "Blocked entrance exam session",
    ipAddress: req.ip,
    meta: {
      examId: session.exam,
      applicantId: session.applicant,
      sessionId: session._id,
      reason: session.blockReason,
      startIpAddress: session.startedIpAddress,
      currentIpAddress: req.ip,
    },
  });

  return session;
}

async function getVerifiedEntranceExamSession({ sessionToken, examId, req, blockOnMismatch = true }) {
  const session = await EntranceExamSession.findOne({ sessionToken, exam: examId });
  if (!session) {
    return { status: 404, message: "Exam session not found. Start the entrance exam again." };
  }

  if (session.status === "blocked") {
    return { status: 403, message: session.blockReason || "This exam session has been blocked." };
  }

  if (session.status === "completed") {
    return { status: 409, message: "This exam session has already been completed." };
  }

  if (session.startedIpAddress && session.startedIpAddress !== req.ip) {
    if (blockOnMismatch) {
      await blockEntranceExamSession(session, req, "IP address changed during entrance exam session.");
    }
    return { status: 403, message: "IP address changed during the entrance exam. Session blocked." };
  }

  session.lastSeenAt = new Date();
  session.currentIpAddress = req.ip;
  session.currentUserAgent = safeTrim(req.headers["user-agent"] || "");
  await session.save();

  return { session };
}

export async function getPublicExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id)
      .select("code title classLevel subjects scheduledAt durationMinutes status")
      .lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (e) {
    next(e);
  }
}

// Entrance exams are taken by applicants using an exam "code" (Exam ID) + full name.
export async function getPublicEntranceExam(req, res, next) {
  try {
    const code = safeTrim(req.params.code || "");
    const exam = await Exam.findOne({ code })
      .select("code title classLevel subjects scheduledAt durationMinutes status")
      .lean();
    if (!exam) return res.status(404).json({ message: "Entrance exam not found" });
    if (exam.status !== "active") return res.status(403).json({ message: "Entrance exam is not published yet." });
    res.json(exam);
  } catch (e) {
    next(e);
  }
}

export async function getPublicEntranceQuestions(req, res, next) {
  try {
    const code = safeTrim(req.params.code || "");
    const exam = await Exam.findOne({ code }).select("_id status").lean();
    if (!exam) return res.status(404).json({ message: "Entrance exam not found" });
    if (exam.status !== "active") return res.status(403).json({ message: "Entrance exam is not published yet." });

    const sessionToken = safeTrim(req.query.sessionToken || "");
    if (!sessionToken) {
      return res.status(400).json({ message: "sessionToken is required to load entrance exam questions." });
    }

    const sessionCheck = await getVerifiedEntranceExamSession({ sessionToken, examId: exam._id, req });
    if (sessionCheck.status) {
      return res.status(sessionCheck.status).json({ message: sessionCheck.message, code: "SESSION_BLOCKED" });
    }

    const limit = Number(req.query.limit || 0);
    const items = await loadEntranceExamQuestions({
      examId: exam._id,
      questionOrder: sessionCheck.session.questionOrder,
      shuffle: false,
      limit,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function startPublicEntranceExamSession(req, res, next) {
  try {
    const missing = requireFields(req.body, ["examCode", "fullName"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const examCode = safeTrim(req.body.examCode);
    const fullName = safeTrim(req.body.fullName);
    const applicantId = req.body.applicantId || undefined;

    const resolved = await resolveEntranceExamAndApplicant({ examCode, applicantId, fullName });
    if (resolved.status) return res.status(resolved.status).json({ message: resolved.message });

    const { exam, applicant } = resolved;
    const existingResult = await ExamResult.findOne({ exam: exam._id, applicant: applicant._id })
      .select("_id")
      .lean();
    if (existingResult) return res.status(409).json({ message: "You have already submitted this entrance exam." });

    const existingSession = await EntranceExamSession.findOne({
      exam: exam._id,
      applicant: applicant._id,
      status: { $in: ["active", "blocked"] },
    }).sort({ startedAt: -1 });

    if (existingSession?.status === "blocked") {
      return res.status(403).json({
        message: existingSession.blockReason || "This entrance exam session has been blocked.",
        code: "SESSION_BLOCKED",
      });
    }

    if (existingSession?.status === "active" && existingSession.startedIpAddress && existingSession.startedIpAddress !== req.ip) {
      await blockEntranceExamSession(existingSession, req, "A second entrance exam session was attempted from a different IP address.");
      return res.status(403).json({
        message: "Entrance exam session blocked because a different IP address tried to resume it.",
        code: "IP_CHANGED",
      });
    }

    let session = existingSession;
    if (!session) {
      const orderedQuestions = await loadEntranceExamQuestions({ examId: exam._id, shuffle: true });
      session = await EntranceExamSession.create({
        exam: exam._id,
        applicant: applicant._id,
        sessionToken: crypto.randomBytes(24).toString("hex"),
        fullName: applicant.fullName,
        questionOrder: orderedQuestions.map((item) => item._id),
        startedIpAddress: req.ip,
        currentIpAddress: req.ip,
        startedUserAgent: safeTrim(req.headers["user-agent"] || ""),
        currentUserAgent: safeTrim(req.headers["user-agent"] || ""),
      });

      await logActivity({
        userId: null,
        action: "Started entrance exam session",
        ipAddress: req.ip,
        meta: {
          examCode,
          examId: exam._id,
          applicantId: applicant._id,
          sessionId: session._id,
        },
      });
    } else {
      session.lastSeenAt = new Date();
      session.currentIpAddress = req.ip;
      session.currentUserAgent = safeTrim(req.headers["user-agent"] || "");
      await session.save();
    }

    const items = await loadEntranceExamQuestions({
      examId: exam._id,
      questionOrder: session.questionOrder,
      shuffle: false,
    });

    res.json({
      ok: true,
      sessionToken: session.sessionToken,
      startedAt: session.startedAt,
      security: { ipBound: true },
      items,
    });
  } catch (e) {
    next(e);
  }
}

export async function heartbeatPublicEntranceExamSession(req, res, next) {
  try {
    const missing = requireFields(req.body, ["sessionToken"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const sessionToken = safeTrim(req.body.sessionToken);
    const session = await EntranceExamSession.findOne({ sessionToken }).select("_id exam status startedIpAddress blockReason");
    if (!session) {
      return res.status(404).json({ message: "Exam session not found. Start the entrance exam again." });
    }

    const sessionCheck = await getVerifiedEntranceExamSession({
      sessionToken,
      examId: session.exam,
      req,
    });
    if (sessionCheck.status) {
      return res.status(sessionCheck.status).json({ message: sessionCheck.message, code: "IP_CHANGED" });
    }

    res.json({ ok: true, status: "active" });
  } catch (e) {
    next(e);
  }
}

export async function submitPublicEntranceExam(req, res, next) {
  try {
    const missing = requireFields(req.body, ["examCode", "fullName", "answers", "sessionToken"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const examCode = safeTrim(req.body.examCode);
    const fullName = safeTrim(req.body.fullName);
    const applicantId = req.body.applicantId || undefined;
    const sessionToken = safeTrim(req.body.sessionToken);
    const isForfeited = safeTrim(req.body.reason || "").toLowerCase().includes("forfeit");

    const resolved = await resolveEntranceExamAndApplicant({ examCode, applicantId, fullName });
    if (resolved.status) return res.status(resolved.status).json({ message: resolved.message });

    const { exam, applicant } = resolved;

    const existing = await ExamResult.findOne({ exam: exam._id, applicant: applicant._id })
      .select("_id")
      .lean();
    if (existing) return res.status(409).json({ message: "You have already submitted this entrance exam." });

    const sessionCheck = await getVerifiedEntranceExamSession({
      sessionToken,
      examId: exam._id,
      req,
    });
    if (sessionCheck.status) {
      return res.status(sessionCheck.status).json({ message: sessionCheck.message, code: "IP_CHANGED" });
    }

    const session = sessionCheck.session;
    if (String(session.applicant) !== String(applicant._id)) {
      await blockEntranceExamSession(session, req, "Entrance exam submission used a mismatched applicant session.");
      return res.status(403).json({ message: "Exam session does not match this applicant.", code: "SESSION_BLOCKED" });
    }

    const graded = await gradeExam({ examId: exam._id, answers: req.body.answers });
    const score = isForfeited ? 0 : graded.score;
    const totalPoints = graded.totalPoints;
    const percentage = isForfeited ? 0 : graded.percentage;
    const passMark = Number(exam?.passMark ?? 50);
    const result = percentage >= passMark ? "passed" : "failed";

    const examResult = await ExamResult.create({
      exam: exam._id,
      applicant: applicant._id,
      fullName: applicant.fullName,
      score,
      totalPoints,
      percentage,
      result,
      manualScore: 0,
      manualTotalPoints: 0,
      overallScore: score,
      overallTotalPoints: totalPoints,
      overallPercentage: percentage,
      answers: req.body.answers,
      submittedAt: new Date(),
      gradedAt: new Date(),
      submissionMeta: {
        ipAddress: req.ip,
        userAgent: safeTrim(req.headers["user-agent"] || ""),
        startIpAddress: session.startedIpAddress,
        startUserAgent: session.startedUserAgent,
        ipConsistent: session.startedIpAddress === req.ip,
        entranceSession: session._id,
      },
    });

    session.status = "completed";
    session.completedAt = new Date();
    session.lastSeenAt = new Date();
    session.currentIpAddress = req.ip;
    session.currentUserAgent = safeTrim(req.headers["user-agent"] || "");
    await session.save();

    await Applicant.updateOne(
      { _id: applicant._id },
      { $set: { exam: exam._id, examScore: percentage, status: "exam_completed", paymentStatus: "none" } }
    );

    await createNotification({
      userId: applicant.parentUser,
      applicantId: applicant._id,
      type: "exam",
      message: "Entrance exam completed and auto-graded. Awaiting review decision.",
    });

    // Notify supervisor teacher + workflow staff.
    if (exam.supervisorTeacher) {
      const t = await Teacher.findById(exam.supervisorTeacher).populate("user", "_id").lean();
      const userId = t?.user?._id || t?.user;
      if (userId) {
        await createNotification({
          userId,
          applicantId: applicant._id,
          type: "exam",
          message: `Entrance exam submitted by ${applicant.fullName}. Auto-graded; please assess if needed.`,
        });
      }
    }

    const assistants = await User.find({ role: Roles.AssistantHeadteacher, isActive: true })
      .select("_id")
      .lean();
    const heads = await User.find({ role: Roles.Headteacher, isActive: true }).select("_id").lean();
    await Promise.all(
      [...assistants, ...heads].map((u) =>
        createNotification({
          userId: u._id,
          applicantId: applicant._id,
          type: "exam",
          message: `Entrance exam completed for ${applicant.fullName}. Awaiting review decision.`,
        })
      )
    );

    await logActivity({
      userId: null,
      action: "Submitted entrance exam (public portal)",
      ipAddress: req.ip,
      meta: {
        examCode,
        examId: exam._id,
        applicantId: applicant._id,
        sessionId: session._id,
        result,
        percentage,
        ipConsistent: session.startedIpAddress === req.ip,
      },
    });

    res.status(201).json({ ok: true, examResultId: examResult._id });
  } catch (e) {
    next(e);
  }
}

export async function getPublicQuestions(req, res, next) {
  try {
    const examId = req.params.id;
    const limit = Number(req.query.limit || 0);
    const shuffle = String(req.query.shuffle || "true") !== "false";

    let items = await ExamQuestion.find({ exam: examId }).select("-correctIndex").lean();
    if (shuffle) items = items.sort(() => Math.random() - 0.5);
    if (limit > 0) items = items.slice(0, limit);
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function submitPublicExam(req, res, next) {
  try {
    const missing = requireFields(req.body, ["examId", "answers"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const examId = req.body.examId;
    const applicantId = req.body.applicantId || undefined;
    const fullName = req.body.fullName ? safeTrim(req.body.fullName) : undefined;

    if (!applicantId && !fullName) {
      return res.status(400).json({ message: "fullName is required when applicantId is not provided" });
    }

    if (applicantId) {
      const existing = await ExamResult.findOne({ exam: examId, applicant: applicantId }).select("_id").lean();
      if (existing) return res.status(409).json({ message: "This applicant has already submitted this exam." });
    }

    const { score, totalPoints, percentage } = await gradeExam({ examId, answers: req.body.answers });
    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const passMark = Number(exam?.passMark ?? 50);
    const result = percentage >= passMark ? "passed" : "failed";

    const examResult = await ExamResult.create({
      exam: examId,
      applicant: applicantId,
      fullName,
      score,
      totalPoints,
      percentage,
      result,
      manualScore: 0,
      manualTotalPoints: 0,
      overallScore: score,
      overallTotalPoints: totalPoints,
      overallPercentage: percentage,
      answers: req.body.answers,
      submittedAt: new Date(),
      gradedAt: new Date(),
      submissionMeta: {
        ipAddress: req.ip,
        userAgent: safeTrim(req.headers["user-agent"] || ""),
      },
    });

    if (applicantId) {
      const applicant = await Applicant.findById(applicantId);
      if (applicant) {
        applicant.exam = examId;
        applicant.examScore = percentage;
        applicant.status = "exam_completed";
        applicant.paymentStatus = "none";
        await applicant.save();

        await createNotification({
          userId: applicant.parentUser,
          applicantId: applicant._id,
          type: "exam",
          message: "Exam completed and auto-graded. Awaiting review decision.",
        });
      }
    }

    await logActivity({
      userId: null,
      action: "Submitted exam (public portal)",
      ipAddress: req.ip,
      meta: { examId, applicantId: applicantId || null, result, percentage },
    });

    res.status(201).json(examResult);
  } catch (e) {
    next(e);
  }
}
