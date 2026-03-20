import ClassModel from "../models/Class.js";
import Teacher from "../models/Teacher.js";
import { requireFields, safeTrim } from "../utils/validators.js";
import { Roles } from "../utils/roles.js";

export async function list(req, res, next) {
  try {
    const filter = {};

    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.json({ items: [] });
      filter.teacher = teacher._id;
    }

    const items = await ClassModel.find(filter)
      .populate({ path: "teacher", populate: { path: "user", select: "name username" } })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const missing = requireFields(req.body, ["name"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const c = await ClassModel.create({
      name: safeTrim(req.body.name),
      teacher: req.body.teacher || undefined,
      capacity: req.body.capacity != null ? Number(req.body.capacity) : undefined,
    });
    res.status(201).json(c);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const c = await ClassModel.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Class not found" });
    if (req.body.name != null) c.name = safeTrim(req.body.name);
    if (req.body.teacher != null) c.teacher = req.body.teacher;
    if (req.body.capacity != null) c.capacity = Number(req.body.capacity);
    await c.save();
    res.json(c);
  } catch (e) {
    next(e);
  }
}
