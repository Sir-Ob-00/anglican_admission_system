import Applicant, { ApplicantStatuses } from "../models/Applicant.js";
import Document from "../models/Document.js";
import Payment from "../models/Payment.js";
import ExamResult from "../models/ExamResult.js";
import Admission from "../models/Admission.js";
import Exam from "../models/Exam.js";
import Teacher from "../models/Teacher.js";
import mongoose from "mongoose";
import { requireFields, safeTrim } from "../utils/validators.js";
import { Roles } from "../utils/roles.js";
import { logActivity } from "../services/activityLogService.js";

export async function createApplicant(req, res, next) {
  try {
    const missing = requireFields(req.body, [
      "fullName",
      "dateOfBirth",
      "gender",
      "classApplyingFor",
      "parentContact",
      "address",
    ]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const applicant = await Applicant.create({
      fullName: safeTrim(req.body.fullName),
      dateOfBirth: new Date(req.body.dateOfBirth),
      gender: req.body.gender,
      classApplyingFor: safeTrim(req.body.classApplyingFor),
      parentName: req.body.parentName ? safeTrim(req.body.parentName) : undefined,
      parentContact: safeTrim(req.body.parentContact),
      address: safeTrim(req.body.address),
      parentUser: req.body.parentUser || undefined,
      createdBy: req.user?._id,
    });

    await logActivity({
      userId: req.user?._id,
      action: "Created applicant",
      ipAddress: req.ip,
      meta: { applicantId: applicant._id },
    });

    res.status(201).json(applicant);
  } catch (e) {
    next(e);
  }
}

export async function listApplicants(req, res, next) {
  try {
    const { status, classApplyingFor, q } = req.query;
    const filter = {};
    if (status && ApplicantStatuses.includes(status)) {
      if (status === "admitted") {
        return res.json({ items: [] });
      }
      filter.status = status;
    } else {
      filter.status = { $ne: "admitted" };
    }
    if (classApplyingFor) filter.classApplyingFor = safeTrim(classApplyingFor);
    if (q) {
      const rx = new RegExp(String(q).replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ fullName: rx }, { parentContact: rx }];
    }

    // Parents can only see their own applicants (if linked).
    if (req.user?.role === Roles.Parent) {
      filter.parentUser = req.user._id;
    }

    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.json({ items: [] });

      const exams = await Exam.find({
        $or: [{ supervisorTeacher: teacher._id }, { supervisorUser: req.user._id }],
      })
        .select("_id")
        .lean();
      const examIds = exams.map((exam) => exam._id);
      if (!examIds.length) return res.json({ items: [] });
      filter.exam = { $in: examIds };
    }

    const items = await Applicant.find(filter)
      .populate("exam", "code title classLevel status supervisorTeacher supervisorUser")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function getApplicant(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid applicant id" });
    }
    const applicant = await Applicant.findById(req.params.id)
      .populate("exam", "code title classLevel scheduledAt durationMinutes passMark status")
      .lean();
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    if (req.user?.role === Roles.Parent && String(applicant.parentUser || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.status(403).json({ message: "Forbidden" });

      const examId = applicant.exam?._id || applicant.exam;
      const exam = examId
        ? await Exam.findById(examId).select("supervisorTeacher supervisorUser").lean()
        : null;
      const allowed =
        exam &&
        (String(exam.supervisorTeacher || "") === String(teacher._id) ||
          String(exam.supervisorUser || "") === String(req.user._id));
      if (!allowed) return res.status(403).json({ message: "Forbidden" });
    }

    const [documents, payments, examResults, admission] = await Promise.all([
      Document.find({ applicant: applicant._id }).sort({ createdAt: -1 }).lean(),
      Payment.find({ applicant: applicant._id }).sort({ createdAt: -1 }).lean(),
      ExamResult.find({ applicant: applicant._id }).sort({ createdAt: -1 }).limit(5).lean(),
      Admission.findOne({ applicant: applicant._id }).lean(),
    ]);

    res.json({
      ...applicant,
      documents,
      payments,
      examResults,
      admission,
    });
  } catch (e) {
    next(e);
  }
}

export async function updateApplicant(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid applicant id" });
    }
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    if (req.user?.role === Roles.Parent && String(applicant.parentUser || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const fields = [
      "fullName",
      "dateOfBirth",
      "gender",
      "classApplyingFor",
      "parentName",
      "parentContact",
      "address",
      "parentUser",
      "status",
      "paymentStatus",
      "admissionStatus",
      "exam",
      "examScore",
    ];

    for (const f of fields) {
      if (req.body[f] == null) continue;
      if (f === "dateOfBirth") applicant.dateOfBirth = new Date(req.body.dateOfBirth);
      else if (["fullName", "classApplyingFor", "parentName", "parentContact", "address"].includes(f))
        applicant[f] = safeTrim(req.body[f]);
      else applicant[f] = req.body[f];
    }

    await applicant.save();

    await logActivity({
      userId: req.user?._id,
      action: "Updated applicant",
      ipAddress: req.ip,
      meta: { applicantId: applicant._id },
    });

    res.json(applicant);
  } catch (e) {
    next(e);
  }
}

export async function deleteApplicant(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid applicant id" });
    }
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    await applicant.deleteOne();
    await logActivity({
      userId: req.user?._id,
      action: "Deleted applicant",
      ipAddress: req.ip,
      meta: { applicantId: req.params.id },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
