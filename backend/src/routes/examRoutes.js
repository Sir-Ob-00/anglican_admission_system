import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import {
  addQuestions,
  assignExamToApplicant,
  createExam,
  decideExamResult,
  getExam,
  getQuestions,
  listExams,
  recommendExamResult,
  teacherAssessExamResult,
  assignSupervisor,
  publishEntranceExam,
  submitExam,
  updateExam,
} from "../controllers/examController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", requireRoles(Roles.Headteacher), createExam);
router.get("/", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher), listExams);
router.get("/:id", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher), getExam);
router.put("/:id", requireRoles(Roles.Headteacher), updateExam);
router.put(
  "/:id/supervisor",
  requireRoles(Roles.Headteacher, Roles.AssistantHeadteacher),
  assignSupervisor
);

// Publish (make available for applicants to take). Only the assigned Teacher or Assistant Headteacher can publish.
router.post(
  "/:id/publish",
  requireRoles(Roles.AssistantHeadteacher, Roles.Teacher),
  publishEntranceExam
);
router.get("/:id/questions", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent), getQuestions);
router.post(
  "/:id/questions",
  requireRoles(Roles.AssistantHeadteacher, Roles.Teacher),
  addQuestions
);

// Applicant exam assignment (Headteacher)
router.post(
  "/assign/applicant/:id",
  requireRoles(Roles.Headteacher),
  assignExamToApplicant
);

// Headteacher decision after exam completion
router.post(
  "/results/:id/decision",
  requireRoles(Roles.Headteacher),
  decideExamResult
);

// Assistant Headteacher recommendation (not final)
router.post(
  "/results/:id/recommendation",
  requireRoles(Roles.AssistantHeadteacher),
  recommendExamResult
);

// Teacher assessment (manual scores + recommendation)
router.post(
  "/results/:id/teacher-assessment",
  requireRoles(Roles.Teacher),
  teacherAssessExamResult
);

router.post(
  "/submit",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  submitExam
);

export default router;
