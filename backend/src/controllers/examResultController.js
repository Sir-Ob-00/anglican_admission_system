import ExamResult from "../models/ExamResult.js";
import Exam from "../models/Exam.js";
import Teacher from "../models/Teacher.js";
import { Roles } from "../utils/roles.js";

export async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.examId) filter.exam = req.query.examId;
    if (req.query.applicantId) filter.applicant = req.query.applicantId;
    if (req.query.pendingDecision === "true") filter.finalDecision = { $exists: false };
    if (req.query.pendingTeacherAssessment === "true") filter["teacherAssessment.assessedAt"] = { $exists: false };

    // For teachers, default to showing only results for exams they supervise.
    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.json({ items: [] });

      const mine = String(req.query.mine || "true") !== "false";
      if (mine) {
        const exams = await Exam.find({ supervisorTeacher: teacher._id }).select("_id").lean();
        const examIds = exams.map((e) => String(e._id));
        if (req.query.examId) {
          if (!examIds.includes(String(req.query.examId))) return res.json({ items: [] });
          filter.exam = req.query.examId;
        } else {
          filter.exam = { $in: examIds };
        }
      }
    }

    const items = await ExamResult.find(filter)
      .populate("exam", "title classLevel")
      .populate("applicant", "fullName classApplyingFor")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function get(req, res, next) {
  try {
    const item = await ExamResult.findById(req.params.id)
      .populate("exam", "title classLevel")
      .populate("applicant", "fullName classApplyingFor")
      .lean();
    if (!item) return res.status(404).json({ message: "Result not found" });
    res.json(item);
  } catch (e) {
    next(e);
  }
}
