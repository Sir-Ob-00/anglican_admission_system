import { Router } from "express";

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import applicantRoutes from "./applicantRoutes.js";
import examRoutes from "./examRoutes.js";
import examQuestionRoutes from "./examQuestionRoutes.js";
import examResultRoutes from "./examResultRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import documentRoutes from "./documentRoutes.js";
import admissionRoutes from "./admissionRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import reportRoutes from "./reportRoutes.js";
import activityLogRoutes from "./activityLogRoutes.js";
import backupRoutes from "./backupRoutes.js";
import teacherRoutes from "./teacherRoutes.js";
import parentRoutes from "./parentRoutes.js";
import classRoutes from "./classRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import studentRoutes from "./studentRoutes.js";
import publicExamRoutes from "./publicExamRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/applicants", applicantRoutes);
router.use("/exams", examRoutes);
router.use("/exam-questions", examQuestionRoutes);
router.use("/exam-results", examResultRoutes);
router.use("/payments", paymentRoutes);
router.use("/documents", documentRoutes);
router.use("/admissions", admissionRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reports", reportRoutes);
router.use("/activity-logs", activityLogRoutes);
router.use("/backups", backupRoutes);
router.use("/teachers", teacherRoutes);
router.use("/parents", parentRoutes);
router.use("/classes", classRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/students", studentRoutes);
router.use("/public", publicExamRoutes);

export default router;
