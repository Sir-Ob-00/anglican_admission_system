import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { assistantSummary, headteacherSummary, parentSummary, summary, teacherSummary } from "../controllers/dashboardController.js";

const router = Router();

router.use(authMiddleware);
router.get("/summary", summary);
router.get("/headteacher", requireRoles(Roles.Headteacher), headteacherSummary);
router.get("/assistant", requireRoles(Roles.AssistantHeadteacher), assistantSummary);
router.get("/teacher", requireRoles(Roles.Teacher), teacherSummary);
router.get("/parent", requireRoles(Roles.Parent), parentSummary);

export default router;
