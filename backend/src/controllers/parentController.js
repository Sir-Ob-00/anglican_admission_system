import Parent from "../models/Parent.js";
import { requireFields, safeTrim } from "../utils/validators.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import Student from "../models/Student.js";
import Applicant from "../models/Applicant.js";
import Admission from "../models/Admission.js";
import { createNotification } from "../services/notificationService.js";
import { logActivity } from "../services/activityLogService.js";

export async function list(req, res, next) {
  try {
    const items = await Parent.find({}).populate("user", "name username role").sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const missing = requireFields(req.body, ["user"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const parent = await Parent.create({
      user: req.body.user,
      phone: req.body.phone ? safeTrim(req.body.phone) : undefined,
      address: req.body.address ? safeTrim(req.body.address) : undefined,
    });
    res.status(201).json(parent);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: "Parent not found" });
    if (req.body.phone != null) parent.phone = safeTrim(req.body.phone);
    if (req.body.address != null) parent.address = safeTrim(req.body.address);
    await parent.save();
    res.json(parent);
  } catch (e) {
    next(e);
  }
}

export async function linkParentToStudent(req, res, next) {
  try {
    const missing = requireFields(req.body, ["parentUserId", "studentId"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const student = await Student.findById(req.body.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.parentUser = req.body.parentUserId;
    await student.save();

    if (student.applicant) {
      await Applicant.updateOne(
        { _id: student.applicant, parentUser: { $exists: false } },
        { $set: { parentUser: req.body.parentUserId } }
      );
      await Applicant.updateOne(
        { _id: student.applicant, parentUser: null },
        { $set: { parentUser: req.body.parentUserId } }
      );
      const admission = await Admission.findOne({ applicant: student.applicant }).lean();
      if (admission) {
        await createNotification({
          userId: req.body.parentUserId,
          applicantId: student.applicant,
          type: "admission",
          message: `Admission approved. Admission number: ${admission.admissionNumber}`,
        });
      }
    }

    await ParentStudentLink.create({
      parentUser: req.body.parentUserId,
      student: student._id,
      linkedBy: req.user?._id,
      linkedAt: new Date(),
    });

    await createNotification({
      userId: req.body.parentUserId,
      type: "system",
      message: "Your parent account was linked to a student record.",
    });

    await logActivity({
      userId: req.user?._id,
      action: "Linked parent to student",
      ipAddress: req.ip,
      meta: { parentUserId: req.body.parentUserId, studentId: student._id },
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    // Handle duplicate link gracefully
    if (String(e?.code) === "11000") return res.status(200).json({ ok: true });
    next(e);
  }
}
