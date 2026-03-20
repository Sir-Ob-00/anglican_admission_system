import ExamQuestion from "../models/ExamQuestion.js";
import { requireFields, safeTrim } from "../utils/validators.js";
import Exam from "../models/Exam.js";
import Teacher from "../models/Teacher.js";
import { Roles } from "../utils/roles.js";

async function requireSupervisor(req, examId) {
  const exam = await Exam.findById(examId).select("status supervisorTeacher supervisorUser").lean();
  if (!exam) return { ok: false, status: 404, message: "Exam not found" };
  if (exam.status === "active") return { ok: false, status: 409, message: "Exam is published. Questions cannot be modified." };

  if (req.user?.role === Roles.Teacher) {
    const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
    if (!teacher) return { ok: false, status: 403, message: "Forbidden" };
    const matchesTeacher = String(exam.supervisorTeacher || "") === String(teacher._id);
    const matchesUser = String(exam.supervisorUser || "") === String(req.user._id);
    if (!matchesTeacher && !matchesUser) return { ok: false, status: 403, message: "Forbidden" };
    return { ok: true, exam };
  }

  if (req.user?.role === Roles.AssistantHeadteacher) {
    if (String(exam.supervisorUser || "") !== String(req.user._id)) {
      return { ok: false, status: 403, message: "Forbidden" };
    }
    return { ok: true, exam };
  }

  return { ok: false, status: 403, message: "Forbidden" };
}

export async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.examId) filter.exam = req.query.examId;
    const items = await ExamQuestion.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const missing = requireFields(req.body, ["exam", "subject", "text", "options", "correctIndex"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const guard = await requireSupervisor(req, req.body.exam);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    const subject = safeTrim(req.body.subject);
    if (!["English", "Maths"].includes(subject)) return res.status(400).json({ message: "subject must be English|Maths" });

    const q = await ExamQuestion.create({
      exam: req.body.exam,
      subject,
      text: safeTrim(req.body.text),
      options: (req.body.options || []).map((o) => safeTrim(o)),
      correctIndex: Number(req.body.correctIndex),
      points: Number(req.body.points || 1),
    });
    res.status(201).json(q);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const q = await ExamQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const guard = await requireSupervisor(req, q.exam);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    if (req.body.subject != null) {
      const subject = safeTrim(req.body.subject);
      if (!["English", "Maths"].includes(subject)) return res.status(400).json({ message: "subject must be English|Maths" });
      q.subject = subject;
    }
    if (req.body.text != null) q.text = safeTrim(req.body.text);
    if (req.body.options != null) q.options = (req.body.options || []).map((o) => safeTrim(o));
    if (req.body.correctIndex != null) q.correctIndex = Number(req.body.correctIndex);
    if (req.body.points != null) q.points = Number(req.body.points);
    await q.save();
    res.json(q);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const q = await ExamQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const guard = await requireSupervisor(req, q.exam);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    await q.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
