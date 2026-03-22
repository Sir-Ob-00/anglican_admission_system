import Teacher from "../models/Teacher.js";
import { requireFields, safeTrim } from "../utils/validators.js";
import User from "../models/User.js";

export async function list(req, res, next) {
  try {
    const items = await Teacher.find({})
      .populate("user", "name username role isActive")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const missing = requireFields(req.body, ["user"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const teacher = await Teacher.create({
      user: req.body.user,
      staffId: req.body.staffId ? safeTrim(req.body.staffId) : undefined,
      subject: req.body.subject ? safeTrim(req.body.subject) : undefined,
      assignedClass: req.body.assignedClass ? safeTrim(req.body.assignedClass) : undefined,
    });
    res.status(201).json(teacher);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    if (req.body.staffId != null) teacher.staffId = safeTrim(req.body.staffId);
    if (req.body.subject != null) teacher.subject = safeTrim(req.body.subject);
    if (req.body.assignedClass != null) teacher.assignedClass = safeTrim(req.body.assignedClass);
    await teacher.save();
    res.json(teacher);
  } catch (e) {
    next(e);
  }
}

export async function setActive(req, res, next) {
  try {
    const teacher = await Teacher.findById(req.params.id).lean();
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    await User.findByIdAndUpdate(teacher.user, { isActive: Boolean(req.body.isActive) });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const missing = requireFields(req.body, ["newPassword"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });
    const teacher = await Teacher.findById(req.params.id).lean();
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const passwordHash = await User.hashPassword(req.body.newPassword);
    await User.findByIdAndUpdate(teacher.user, { passwordHash });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
