import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import ClassModel from "../models/Class.js";
import { Roles } from "../utils/roles.js";

export async function list(req, res, next) {
  try {
    const filter = {};

    if (req.user?.role === Roles.Teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
      if (!teacher) return res.json({ items: [] });

      const classes = await ClassModel.find({ teacher: teacher._id }).select("_id").lean();
      const classIds = classes.map((c) => c._id);
      filter.classAssigned = { $in: classIds };
    }

    if (req.user?.role === Roles.Parent) {
      filter.parentUser = req.user._id;
    }

    const items = await Student.find(filter)
      .populate("classAssigned", "name")
      .populate("parentUser", "name username")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function get(req, res, next) {
  try {
    const s = await Student.findById(req.params.id)
      .populate("classAssigned", "name")
      .populate("parentUser", "name username")
      .lean();
    if (!s) return res.status(404).json({ message: "Student not found" });

    if (req.user?.role === Roles.Parent && String(s.parentUser || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(s);
  } catch (e) {
    next(e);
  }
}
