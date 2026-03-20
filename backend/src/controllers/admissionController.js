import Admission from "../models/Admission.js";
import { requireFields } from "../utils/validators.js";
import { approveAdmission } from "../services/admissionService.js";
import { createNotification } from "../services/notificationService.js";
import { logActivity } from "../services/activityLogService.js";
import Applicant from "../models/Applicant.js";
import Student from "../models/Student.js";
import { Roles } from "../utils/roles.js";

export async function list(req, res, next) {
  try {
    const items = await Admission.find({})
      .populate("applicant", "fullName classApplyingFor status")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("applicant not found")) {
      return res.status(404).json({ message: msg });
    }
    if (msg.toLowerCase().includes("payment not completed")) {
      return res.status(400).json({ message: msg });
    }
    if (msg.toLowerCase().includes("invalid classassigned")) {
      return res.status(400).json({ message: msg });
    }
    if (msg.toLowerCase().includes("already admitted") || msg.toLowerCase().includes("student record already exists")) {
      return res.status(409).json({ message: msg });
    }
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Admission already exists for this applicant." });
    }
    next(e);
  }
}

export async function get(req, res, next) {
  try {
    const item = await Admission.findById(req.params.id)
      .populate("applicant", "fullName classApplyingFor status")
      .lean();
    if (!item) return res.status(404).json({ message: "Admission not found" });
    res.json(item);
  } catch (e) {
    next(e);
  }
}

export async function approve(req, res, next) {
  try {
    const missing = requireFields(req.body, ["applicantId"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const { admission, applicant } = await approveAdmission({
      applicantId: req.body.applicantId,
      approvedBy: req.user?._id,
      classAssigned: req.body.classAssigned || undefined,
    });

    const refreshed = await Applicant.findById(applicant._id).lean();
    await createNotification({
      userId: refreshed?.parentUser,
      applicantId: refreshed?._id,
      type: "admission",
      message: `Admission approved. Admission number: ${admission.admissionNumber}`,
    });

    await logActivity({
      userId: req.user?._id,
      action: "Approved admission",
      ipAddress: req.ip,
      meta: { applicantId: req.body.applicantId, admissionId: admission._id },
    });

    res.status(201).json(admission);
  } catch (e) {
    next(e);
  }
}

export async function reject(req, res, next) {
  try {
    const missing = requireFields(req.body, ["applicantId"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const applicant = await Applicant.findById(req.body.applicantId);
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    applicant.status = "rejected";
    applicant.admissionStatus = "rejected";
    await applicant.save();

    await createNotification({
      userId: applicant.parentUser,
      applicantId: applicant._id,
      type: "admission",
      message: "Admission rejected.",
    });

    await logActivity({
      userId: req.user?._id,
      action: "Rejected admission",
      ipAddress: req.ip,
      meta: { applicantId: applicant._id },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function downloadConfirmation(req, res, next) {
  try {
    const applicant = await Applicant.findById(req.params.applicantId).lean();
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    if (req.user?.role === Roles.Parent && String(applicant.parentUser || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (String(applicant.status || "") !== "admitted") {
      return res.status(400).json({ message: "Admission confirmation is only available after admission." });
    }

    const [admission, student] = await Promise.all([
      Admission.findOne({ applicant: applicant._id }).lean(),
      Student.findOne({ applicant: applicant._id }).populate("classAssigned", "name").lean(),
    ]);

    if (!admission || !student) {
      return res.status(404).json({ message: "Admission record not found" });
    }

    const filename = `admission_confirmation_${admission.admissionNumber}.txt`;
    const lines = [
      "Anglican School Admission Management System",
      "Admission Confirmation",
      "----------------------------------------",
      `Admission Number: ${admission.admissionNumber}`,
      `Student: ${student.fullName}`,
      `Assigned Class: ${student.classAssigned?.name || "—"}`,
      `Approved At: ${admission.approvedAt ? new Date(admission.approvedAt).toISOString() : "—"}`,
      `Generated At: ${new Date().toISOString()}`,
      "",
    ];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(lines.join("\n"));
  } catch (e) {
    next(e);
  }
}
