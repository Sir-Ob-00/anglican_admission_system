import { Router } from "express";
import {
  getPublicExam,
  getPublicQuestions,
  submitPublicExam,
  getPublicEntranceExam,
  getPublicEntranceQuestions,
  startPublicEntranceExamSession,
  heartbeatPublicEntranceExamSession,
  submitPublicEntranceExam,
} from "../controllers/publicExamController.js";

const router = Router();

router.get("/exams/:id", getPublicExam);
router.get("/exams/:id/questions", getPublicQuestions);
router.post("/exams/submit", submitPublicExam);

// Entrance exam portal (preferred): use Exam.code as the "Exam ID"
router.get("/entrance-exams/:code", getPublicEntranceExam);
router.get("/entrance-exams/:code/questions", getPublicEntranceQuestions);
router.post("/entrance-exams/start", startPublicEntranceExamSession);
router.post("/entrance-exams/heartbeat", heartbeatPublicEntranceExamSession);
router.post("/entrance-exams/submit", submitPublicEntranceExam);

export default router;
