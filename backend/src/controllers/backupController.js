import Backup from "../models/Backup.js";
import { logActivity } from "../services/activityLogService.js";
import path from "path";
import { backupsDir, createBackup } from "../services/backupService.js";

export async function create(req, res, next) {
  try {
    const backup = await createBackup({
      createdBy: req.user?._id,
      notes: "Manual backup created from dashboard.",
    });

    await logActivity({ userId: req.user?._id, action: "Created backup", ipAddress: req.ip, meta: { backupId: backup._id } });
    res.status(201).json(backup);
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const items = await Backup.find({}).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function download(req, res, next) {
  try {
    const backup = await Backup.findById(req.params.id).lean();
    if (!backup) return res.status(404).json({ message: "Backup not found" });
    if (!backup.filePath) return res.status(404).json({ message: "Backup file not available" });
    const diskPath = path.join(backupsDir, path.basename(backup.filePath));
    res.download(diskPath, backup.name);
  } catch (e) {
    next(e);
  }
}

export async function restore(req, res, next) {
  try {
    const backup = await Backup.findById(req.params.id).lean();
    if (!backup) return res.status(404).json({ message: "Backup not found" });
    if (!backup.filePath) return res.status(404).json({ message: "Backup file not available" });
    const diskPath = path.join(backupsDir, path.basename(backup.filePath));
    const raw = await fs.readFile(diskPath, "utf8");
    const payload = JSON.parse(raw);

    const dryRun = req.body?.confirm !== true;
    const counts = {
      users: payload.users?.length || 0,
      applicants: payload.applicants?.length || 0,
      students: payload.students?.length || 0,
      payments: payload.payments?.length || 0,
      documents: payload.documents?.length || 0,
      admissions: payload.admissions?.length || 0,
      notifications: payload.notifications?.length || 0,
      activityLogs: payload.activityLogs?.length || 0,
    };

    if (dryRun) {
      return res.json({ dryRun: true, counts, message: "Send { confirm: true } to apply restore." });
    }

    // Very basic restore: insertMany ordered:false (duplicates may error and be skipped).
    const insert = async (Model, items) => {
      if (!Array.isArray(items) || !items.length) return { inserted: 0 };
      try {
        await Model.insertMany(items, { ordered: false });
        return { inserted: items.length };
      } catch {
        return { inserted: 0 };
      }
    };

    await insert(User, payload.users);
    await insert(Applicant, payload.applicants);
    await insert(Student, payload.students);
    await insert(Teacher, payload.teachers);
    await insert(Parent, payload.parents);
    await insert(ClassModel, payload.classes);
    await insert(Exam, payload.exams);
    await insert(ExamQuestion, payload.examQuestions);
    await insert(ExamResult, payload.examResults);
    await insert(Payment, payload.payments);
    await insert(Document, payload.documents);
    await insert(Admission, payload.admissions);
    await insert(Notification, payload.notifications);
    await insert(ActivityLog, payload.activityLogs);

    await logActivity({ userId: req.user?._id, action: "Restored backup", ipAddress: req.ip, meta: { backupId: backup._id } });
    res.json({ ok: true, restored: true, counts });
  } catch (e) {
    next(e);
  }
}
