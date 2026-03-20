import Exam from "../models/Exam.js";
import ExamQuestion from "../models/ExamQuestion.js";
import ExamResult from "../models/ExamResult.js";
import Applicant from "../models/Applicant.js";
import { requireFields, safeTrim } from "../utils/validators.js";
import { gradeExam } from "../services/examService.js";
import { createNotification } from "../services/notificationService.js";
import { logActivity } from "../services/activityLogService.js";
import { generateExamId } from "../utils/generateExamId.js";
import Teacher from "../models/Teacher.js";
import { Roles } from "../utils/roles.js";
import User from "../models/User.js";

function buildEntranceExamPortalLink({ examCode, applicantId, fullName }) {
  const params = new URLSearchParams({
    applicantId: String(applicantId || ""),
    fullName: String(fullName || ""),
  });
  return `/entrance-exam/${encodeURIComponent(examCode)}?${params.toString()}`;
}

export async function createExam(req, res, next) {
  try {
    const missing = requireFields(req.body, ["title", "classLevel"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const exam = await Exam.create({
      code: generateExamId(),
      title: safeTrim(req.body.title),
      classLevel: safeTrim(req.body.classLevel),
      subjects: Array.isArray(req.body.subjects) ? req.body.subjects.map((s) => safeTrim(s)) : [],
      supervisorTeacher: req.body.supervisorTeacher || undefined,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      durationMinutes: Number(req.body.durationMinutes || 30),
      passMark: Number(req.body.passMark || 50),
      status: req.body.status || "draft",
      createdBy: req.user?._id,
    });

    await logActivity({ userId: req.user?._id, action: "Created exam", ipAddress: req.ip, meta: { examId: exam._id } });
    res.status(201).json(exam);
  } catch (e) {
    next(e);
  }
}

export async function listExams(req, res, next) {
  try {
    const { classLevel, status } = req.query;
    const filter = {};
    if (classLevel) filter.classLevel = safeTrim(classLevel);
    if (status) filter.status = safeTrim(status);

    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.json({ items: [] });
      filter.$or = [{ supervisorTeacher: teacher._id }, { supervisorUser: req.user._id }];
    } else if (req.user?.role === Roles.AssistantHeadteacher) {
      filter.supervisorUser = req.user._id;
    }
    const items = await Exam.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function getExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("supervisorTeacher")
      .populate("supervisorUser", "_id name username role")
      .lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (e) {
    next(e);
  }
}

export async function updateExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (req.body.title != null) exam.title = safeTrim(req.body.title);
    if (req.body.classLevel != null) exam.classLevel = safeTrim(req.body.classLevel);
    if (req.body.scheduledAt != null) exam.scheduledAt = new Date(req.body.scheduledAt);
    if (req.body.durationMinutes != null) exam.durationMinutes = Number(req.body.durationMinutes);
    if (req.body.passMark != null) exam.passMark = Number(req.body.passMark);
    if (req.body.status != null) exam.status = safeTrim(req.body.status);
    if (req.body.subjects != null) {
      exam.subjects = Array.isArray(req.body.subjects) ? req.body.subjects.map((s) => safeTrim(s)) : [];
    }
    if (req.body.supervisorTeacher != null) exam.supervisorTeacher = req.body.supervisorTeacher || undefined;
    if (req.body.supervisorUser != null) exam.supervisorUser = req.body.supervisorUser || undefined;

    await exam.save();

    await logActivity({
      userId: req.user?._id,
      action: "Updated exam",
      ipAddress: req.ip,
      meta: { examId: exam._id },
    });

    res.json(exam);
  } catch (e) {
    next(e);
  }
}

export async function assignSupervisor(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (req.body.supervisorTeacher != null) exam.supervisorTeacher = req.body.supervisorTeacher || undefined;
    if (req.body.supervisorUser != null) exam.supervisorUser = req.body.supervisorUser || undefined;
    if (req.body.subjects != null) {
      exam.subjects = Array.isArray(req.body.subjects) ? req.body.subjects.map((s) => safeTrim(s)) : [];
    }
    if (req.body.scheduledAt != null) exam.scheduledAt = new Date(req.body.scheduledAt);
    if (req.body.status != null) exam.status = safeTrim(req.body.status);

    await exam.save();

    if (exam.supervisorTeacher) {
      const t = await Teacher.findById(exam.supervisorTeacher).populate("user", "_id").lean();
      const userId = t?.user?._id || t?.user;
      if (userId && !exam.supervisorUser) {
        exam.supervisorUser = userId;
        await exam.save();
      }
      if (userId) {
        await createNotification({
          userId,
          type: "exam",
          message: `You have been assigned to supervise an entrance exam (${exam.code}).`,
        });
      }
    }

    await logActivity({
      userId: req.user?._id,
      action: "Assigned exam supervisor",
      ipAddress: req.ip,
      meta: { examId: exam._id, supervisorTeacher: exam.supervisorTeacher },
    });

    res.json(exam);
  } catch (e) {
    next(e);
  }
}

export async function assignExamToApplicant(req, res, next) {
  try {
    const missing = requireFields(req.body, ["examId"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    const examDoc = await Exam.findById(req.body.examId);
    const exam = examDoc?.toObject();
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Optional: Assign a supervisor (Class Teacher or Assistant Headteacher) for this applicant's entrance exam.
    if (req.body.supervisorUserId) {
      const supervisorUserId = req.body.supervisorUserId;
      const supervisor = await User.findById(supervisorUserId).select("_id role isActive").lean();
      if (!supervisor || supervisor.isActive === false) {
        return res.status(400).json({ message: "Invalid supervisorUserId" });
      }
      if (supervisor.role === Roles.Teacher) {
        const teacher = await Teacher.findOne({ user: supervisor._id }).select("_id").lean();
        if (!teacher) return res.status(400).json({ message: "Selected teacher has no Teacher profile" });
        examDoc.supervisorTeacher = teacher._id;
        examDoc.supervisorUser = supervisor._id;
      } else if (supervisor.role === Roles.AssistantHeadteacher) {
        examDoc.supervisorTeacher = undefined;
        examDoc.supervisorUser = supervisor._id;
      } else {
        return res.status(400).json({ message: "Supervisor must be a Teacher or Assistant Headteacher" });
      }
      await examDoc.save();
    }

    applicant.exam = exam._id;
    applicant.examAssignedAt = new Date();
    applicant.status = "exam_scheduled";
    await applicant.save();

    const portalHint = `Exam ID: ${exam.code}. Use the Entrance Exam Portal to write.`;
    const portalLink = buildEntranceExamPortalLink({
      examCode: exam.code,
      applicantId: applicant._id,
      fullName: applicant.fullName,
    });

    await createNotification({
      userId: applicant.parentUser,
      applicantId: applicant._id,
      type: "exam",
      message: `Entrance exam scheduled. ${portalHint}`,
      link: { url: portalLink, label: "Open portal" },
    });

    // Notify all assistant headteachers (workflow participants).
    const assistants = await User.find({ role: Roles.AssistantHeadteacher, isActive: true })
      .select("_id")
      .lean();
    if (assistants.length) {
      await Promise.all(
        assistants.map((u) =>
          createNotification({
            userId: u._id,
            applicantId: applicant._id,
            type: "exam",
            message: `Entrance exam assigned for applicant ${applicant.fullName}. ${portalHint}`,
            link: { url: portalLink, label: "Open portal" },
          })
        )
      );
    }

    // Notify the assigned supervisor (teacher or assistant headteacher).
    const supervisorUserId =
      examDoc?.supervisorUser ||
      (exam.supervisorTeacher
        ? (await Teacher.findById(exam.supervisorTeacher).populate("user", "_id").lean())?.user?._id
        : null);
    if (supervisorUserId) {
      await createNotification({
        userId: supervisorUserId,
        applicantId: applicant._id,
        type: "exam",
        message: `Entrance exam assigned for applicant ${applicant.fullName}. ${portalHint}`,
        link: { url: portalLink, label: "Open portal" },
      });
    }

    await logActivity({
      userId: req.user?._id,
      action: "Assigned exam to applicant",
      ipAddress: req.ip,
      meta: { applicantId: applicant._id, examId: req.body.examId },
    });

    res.json({ ok: true, applicantId: applicant._id, examId: applicant.exam });
  } catch (e) {
    next(e);
  }
}

export async function publishEntranceExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.status === "active") return res.status(409).json({ message: "Exam is already published" });

    // Only the assigned supervisor (Teacher or Assistant Headteacher) can publish.
    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.status(403).json({ message: "Forbidden" });
      const ok =
        String(exam.supervisorTeacher || "") === String(teacher._id) ||
        String(exam.supervisorUser || "") === String(req.user._id);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
    } else if (req.user?.role === Roles.AssistantHeadteacher) {
      if (String(exam.supervisorUser || "") !== String(req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const qCount = await ExamQuestion.countDocuments({ exam: exam._id });
    if (qCount < 10 || qCount > 20) {
      return res.status(400).json({ message: "Entrance exam must have between 10 and 20 questions before publishing." });
    }

    const allowedSubjects = ["English", "Maths"];
    if (!Array.isArray(exam.subjects) || exam.subjects.length === 0) {
      exam.subjects = allowedSubjects;
    } else if (exam.subjects.some((s) => !allowedSubjects.includes(String(s)))) {
      return res.status(400).json({ message: "Only English and Maths subjects are allowed for entrance exams." });
    }

    exam.status = "active";
    exam.publishedAt = new Date();
    await exam.save();

    // Notify parents of applicants assigned to this exam (usually 1 per exam in this workflow).
    const applicants = await Applicant.find({ exam: exam._id, status: "exam_scheduled" })
      .select("_id fullName parentUser")
      .lean();
    await Promise.all(
      applicants.map((a) => {
        const portalLink = buildEntranceExamPortalLink({
          examCode: exam.code,
          applicantId: a._id,
          fullName: a.fullName,
        });
        return (
        createNotification({
          userId: a.parentUser,
          applicantId: a._id,
          type: "exam",
          message: `Entrance exam is now published and available. Exam ID: ${exam.code}.`,
          link: { url: portalLink, label: "Open portal" },
        })
        );
      })
    );

    await logActivity({
      userId: req.user?._id,
      action: "Published entrance exam",
      ipAddress: req.ip,
      meta: { examId: exam._id, code: exam.code, questions: qCount },
    });

    res.json({ ok: true, exam });
  } catch (e) {
    next(e);
  }
}

export async function decideExamResult(req, res, next) {
  try {
    const decision = safeTrim(req.body.decision);
    const allowed = ["approve", "reject", "reexam"];
    if (!allowed.includes(decision)) return res.status(400).json({ message: "decision must be approve|reject|reexam" });

    const result = await ExamResult.findById(req.params.id);
    if (!result) return res.status(404).json({ message: "Exam result not found" });

    if (!result.applicant) return res.status(400).json({ message: "Exam result is not linked to an applicant" });

    const applicant = await Applicant.findById(result.applicant);
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    if (decision === "approve") {
      applicant.status = "exam_passed";
      // Payment is initiated by Assistant Headteacher (separate workflow step).
      applicant.paymentStatus = "none";
      applicant.admissionStatus = "none";
      await createNotification({
        userId: applicant.parentUser,
        applicantId: applicant._id,
        type: "exam",
        message: "Entrance exam passed. Await payment request.",
      });
    } else if (decision === "reject") {
      applicant.status = "exam_failed";
      applicant.admissionStatus = "rejected";
      applicant.paymentStatus = "none";
      await createNotification({
        userId: applicant.parentUser,
        applicantId: applicant._id,
        type: "exam",
        message: "Exam result rejected. Admission not approved.",
      });
    } else {
      // reexam
      applicant.status = "exam_scheduled";
      applicant.examScore = null;
      await createNotification({
        userId: applicant.parentUser,
        applicantId: applicant._id,
        type: "exam",
        message: "Re-exam requested. A new exam schedule will be provided.",
      });
    }

    await applicant.save();

    result.finalDecision = decision;
    result.decidedBy = req.user?._id;
    result.decidedAt = new Date();
    await result.save();

    await logActivity({
      userId: req.user?._id,
      action: "Decided exam result",
      ipAddress: req.ip,
      meta: { examResultId: result._id, applicantId: applicant._id, decision },
    });

    res.json({ ok: true, decision });
  } catch (e) {
    next(e);
  }
}

export async function addQuestions(req, res, next) {
  try {
    const examId = req.params.id;
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];
    if (!questions.length) return res.status(400).json({ message: "questions[] is required" });

    const exam = await Exam.findById(examId).select("status supervisorTeacher supervisorUser").lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.status === "active") return res.status(409).json({ message: "Exam is published. Questions cannot be modified." });

    // Only the assigned supervisor can add questions.
    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.status(403).json({ message: "Forbidden" });
      const ok =
        String(exam.supervisorTeacher || "") === String(teacher._id) ||
        String(exam.supervisorUser || "") === String(req.user._id);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
    } else if (req.user?.role === Roles.AssistantHeadteacher) {
      if (String(exam.supervisorUser || "") !== String(req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowedSubjects = ["English", "Maths"];
    for (const q of questions) {
      const subject = safeTrim(q.subject || "");
      if (!allowedSubjects.includes(subject)) {
        return res.status(400).json({ message: "Each question must have subject English or Maths." });
      }
    }

    const created = await ExamQuestion.insertMany(
      questions.map((q) => ({
        exam: examId,
        subject: safeTrim(q.subject),
        text: safeTrim(q.text),
        options: (q.options || []).map((o) => safeTrim(o)),
        correctIndex: Number(q.correctIndex),
        points: Number(q.points || 1),
      }))
    );

    await logActivity({ userId: req.user?._id, action: "Added exam questions", ipAddress: req.ip, meta: { examId, count: created.length } });
    res.status(201).json({ items: created });
  } catch (e) {
    next(e);
  }
}

export async function getQuestions(req, res, next) {
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

export async function submitExam(req, res, next) {
  try {
    const missing = requireFields(req.body, ["examId", "answers"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const examId = req.body.examId;
    const applicantId = req.body.applicantId;
    const fullName = req.body.fullName ? safeTrim(req.body.fullName) : undefined;

    const { score, totalPoints, percentage } = await gradeExam({ examId, answers: req.body.answers });

    const exam = await Exam.findById(examId).lean();
    const passMark = Number(exam?.passMark ?? 50);
    const result = percentage >= passMark ? "passed" : "failed";

    const examResult = await ExamResult.create({
      exam: examId,
      applicant: applicantId || undefined,
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
        // Auto-grade completes the exam. Headteacher still makes the final decision.
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
      userId: req.user?._id,
      action: "Submitted exam",
      ipAddress: req.ip,
      meta: { examId, applicantId, result, percentage },
    });

    res.status(201).json(examResult);
  } catch (e) {
    next(e);
  }
}

export async function recommendExamResult(req, res, next) {
  try {
    const recommendedResult = safeTrim(req.body.recommendedResult);
    if (!["passed", "failed"].includes(recommendedResult)) {
      return res.status(400).json({ message: "recommendedResult must be passed|failed" });
    }

    const resultDoc = await ExamResult.findById(req.params.id);
    if (!resultDoc) return res.status(404).json({ message: "Exam result not found" });

    resultDoc.assistantRecommendation = {
      recommendedResult,
      note: req.body.note ? safeTrim(req.body.note) : "",
      recommendedBy: req.user?._id,
      recommendedAt: new Date(),
    };
    await resultDoc.save();

    await logActivity({
      userId: req.user?._id,
      action: "Recommended exam result",
      ipAddress: req.ip,
      meta: { examResultId: resultDoc._id, recommendedResult },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function teacherAssessExamResult(req, res, next) {
  try {
    const resultDoc = await ExamResult.findById(req.params.id);
    if (!resultDoc) return res.status(404).json({ message: "Exam result not found" });

    // Teachers can only assess results for exams they supervise.
    const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
    if (!teacher) return res.status(403).json({ message: "Forbidden" });
    const exam = await Exam.findById(resultDoc.exam).select("supervisorTeacher").lean();
    if (!exam || String(exam.supervisorTeacher || "") !== String(teacher._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const recommendation = safeTrim(req.body.recommendation);
    if (!["pass", "fail", "borderline", ""].includes(recommendation)) {
      return res.status(400).json({ message: "recommendation must be pass|fail|borderline" });
    }

    const manualScore = req.body.manualScore != null ? Number(req.body.manualScore) : undefined;
    const manualTotalPoints = req.body.manualTotalPoints != null ? Number(req.body.manualTotalPoints) : undefined;
    if (manualScore != null && (!Number.isFinite(manualScore) || manualScore < 0)) {
      return res.status(400).json({ message: "manualScore must be a non-negative number" });
    }
    if (manualTotalPoints != null && (!Number.isFinite(manualTotalPoints) || manualTotalPoints < 0)) {
      return res.status(400).json({ message: "manualTotalPoints must be a non-negative number" });
    }
    if (manualScore != null && manualTotalPoints != null && manualScore > manualTotalPoints) {
      return res.status(400).json({ message: "manualScore cannot exceed manualTotalPoints" });
    }

    if (manualScore != null) resultDoc.manualScore = manualScore;
    if (manualTotalPoints != null) resultDoc.manualTotalPoints = manualTotalPoints;

    const overallScore = Number(resultDoc.score || 0) + Number(resultDoc.manualScore || 0);
    const overallTotalPoints = Number(resultDoc.totalPoints || 0) + Number(resultDoc.manualTotalPoints || 0);
    const overallPercentage = overallTotalPoints
      ? Math.round((overallScore / overallTotalPoints) * 1000) / 10
      : Number(resultDoc.percentage || 0);

    resultDoc.overallScore = overallScore;
    resultDoc.overallTotalPoints = overallTotalPoints;
    resultDoc.overallPercentage = overallPercentage;

    // Update the stored result based on the overall percentage (teacher may add manual scores).
    const fullExam = await Exam.findById(resultDoc.exam).select("passMark").lean();
    const pm = Number(fullExam?.passMark ?? 50);
    resultDoc.result = overallPercentage >= pm ? "passed" : "failed";

    resultDoc.teacherAssessment = {
      recommendation: recommendation || undefined,
      note: req.body.note ? safeTrim(req.body.note) : "",
      manualScore: resultDoc.manualScore,
      manualTotalPoints: resultDoc.manualTotalPoints,
      assessedBy: req.user?._id,
      assessedAt: new Date(),
    };

    await resultDoc.save();

    // If this result is linked to an applicant, keep the applicant's score current for visibility.
    if (resultDoc.applicant) {
      const applicant = await Applicant.findById(resultDoc.applicant);
      if (applicant) {
        applicant.examScore = overallPercentage;
        await applicant.save();
      }

      // Notify Headteacher + Assistant Headteacher that assessment is ready to review.
      const heads = await User.find({ role: Roles.Headteacher, isActive: true }).select("_id").lean();
      const assistants = await User.find({ role: Roles.AssistantHeadteacher, isActive: true }).select("_id").lean();
      await Promise.all(
        [...heads, ...assistants].map((u) =>
          createNotification({
            userId: u._id,
            applicantId: applicant._id,
            type: "exam",
            message: `Teacher assessment submitted for ${applicant.fullName} (manual score updated). Ready for review.`,
          })
        )
      );
    }

    await logActivity({
      userId: req.user?._id,
      action: "Teacher assessed exam result",
      ipAddress: req.ip,
      meta: {
        examResultId: resultDoc._id,
        recommendation: recommendation || null,
        manualScore: resultDoc.manualScore,
        manualTotalPoints: resultDoc.manualTotalPoints,
      },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
