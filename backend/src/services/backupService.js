import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import Backup from "../models/Backup.js";
import User from "../models/User.js";
import Applicant from "../models/Applicant.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import ClassModel from "../models/Class.js";
import Exam from "../models/Exam.js";
import ExamQuestion from "../models/ExamQuestion.js";
import ExamResult from "../models/ExamResult.js";
import Payment from "../models/Payment.js";
import Document from "../models/Document.js";
import Admission from "../models/Admission.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const backupsDir = path.join(__dirname, "..", "uploads", "backups");

export async function createBackup({ createdBy, notes }) {
  const name = `backup_${new Date().toISOString().slice(0, 10).replaceAll("-", "_")}_${Date.now()}.json`;

  const payload = {
    meta: { createdAt: new Date().toISOString(), version: 1 },
    users: await User.find({}).select("-passwordHash").lean(),
    applicants: await Applicant.find({}).lean(),
    students: await Student.find({}).lean(),
    teachers: await Teacher.find({}).lean(),
    parents: await Parent.find({}).lean(),
    classes: await ClassModel.find({}).lean(),
    exams: await Exam.find({}).lean(),
    examQuestions: await ExamQuestion.find({}).lean(),
    examResults: await ExamResult.find({}).lean(),
    payments: await Payment.find({}).lean(),
    documents: await Document.find({}).lean(),
    admissions: await Admission.find({}).lean(),
    notifications: await Notification.find({}).lean(),
    activityLogs: await ActivityLog.find({}).lean(),
  };

  await fs.mkdir(backupsDir, { recursive: true });
  const diskPath = path.join(backupsDir, name);
  await fs.writeFile(diskPath, JSON.stringify(payload, null, 2), "utf8");

  return Backup.create({
    name,
    status: "created",
    createdBy: createdBy || undefined,
    filePath: `/uploads/backups/${name}`,
    notes: notes || "JSON export created by the application.",
  });
}

