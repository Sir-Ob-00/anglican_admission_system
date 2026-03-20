import path from "path";
import Document from "../models/Document.js";
import Applicant from "../models/Applicant.js";
import { requireFields, safeTrim } from "../utils/validators.js";
import { createNotification } from "../services/notificationService.js";
import { logActivity } from "../services/activityLogService.js";
import { Roles } from "../utils/roles.js";
import Student from "../models/Student.js";

export async function uploadDocument(req, res, next) {
  try {
    const missing = requireFields(req.body, ["documentType"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });
    if (!req.file) return res.status(400).json({ message: "file is required" });

    const applicantIdRaw = req.body.applicantId || undefined;
    const studentIdRaw = req.body.studentId || undefined;
    if (!applicantIdRaw && !studentIdRaw) {
      return res.status(400).json({ message: "applicantId or studentId is required" });
    }

    let applicantId = applicantIdRaw;
    if (!applicantId && studentIdRaw) {
      const s = await Student.findById(studentIdRaw).lean();
      if (!s) return res.status(404).json({ message: "Student not found" });
      applicantId = s.applicant;
    }

    const applicant = await Applicant.findById(applicantId).lean();
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    // Parent uploads are only allowed after admission, and only for their own child.
    if (req.user?.role === Roles.Parent) {
      if (String(applicant.parentUser || "") !== String(req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (String(applicant.status || "") !== "admitted") {
        return res.status(403).json({ message: "Documents can only be uploaded after admission." });
      }
      const s = await Student.findOne({ applicant: applicant._id, parentUser: req.user._id })
        .select("_id")
        .lean();
      if (!s) return res.status(403).json({ message: "Documents can only be uploaded for admitted students." });
    }

    const doc = await Document.create({
      applicant: applicant._id,
      documentType: safeTrim(req.body.documentType),
      filePath: `/uploads/documents/${path.basename(req.file.path)}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user?._id,
    });

    await createNotification({
      userId: applicant?.parentUser,
      applicantId: applicant?._id,
      type: "system",
      message: "A document was uploaded for your application.",
    });

    await logActivity({
      userId: req.user?._id,
      action: "Uploaded document",
      ipAddress: req.ip,
      meta: { applicantId: applicant._id, documentId: doc._id, documentType: doc.documentType },
    });

    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

export async function listDocumentsForApplicant(req, res, next) {
  try {
    const applicantId = req.params.applicantId;

    if (req.user?.role === Roles.Parent) {
      const a = await Applicant.findById(applicantId).select("parentUser status").lean();
      if (!a) return res.status(404).json({ message: "Applicant not found" });
      if (String(a.parentUser || "") !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
      if (String(a.status || "") !== "admitted") return res.json({ items: [] });
    }

    const items = await Document.find({ applicant: applicantId })
      .populate("applicant", "fullName classApplyingFor")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const filter = {};

    if (req.user?.role === Roles.Parent) {
      // Parents can only see documents for their admitted students.
      const admittedApplicants = await Applicant.find({ parentUser: req.user._id, status: "admitted" })
        .select("_id")
        .lean();
      filter.applicant = { $in: admittedApplicants.map((a) => a._id) };
      if (req.query.applicantId) {
        const wanted = String(req.query.applicantId);
        const allowed = admittedApplicants.some((a) => String(a._id) === wanted);
        if (!allowed) return res.json({ items: [] });
        filter.applicant = wanted;
      }
    } else if (req.query.applicantId) {
      filter.applicant = req.query.applicantId;
    }

    const items = await Document.find(filter)
      .populate("applicant", "fullName classApplyingFor")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function verifyDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    doc.verified = true;
    doc.verifiedBy = req.user?._id;
    doc.verifiedAt = new Date();
    await doc.save();

    await logActivity({
      userId: req.user?._id,
      action: "Verified document",
      ipAddress: req.ip,
      meta: { documentId: doc._id, applicantId: doc.applicant },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
