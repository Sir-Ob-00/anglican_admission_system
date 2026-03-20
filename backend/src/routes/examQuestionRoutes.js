import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { create, list, remove, update } from "../controllers/examQuestionController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher), list);
router.post("/", requireRoles(Roles.AssistantHeadteacher, Roles.Teacher), create);
router.put("/:id", requireRoles(Roles.AssistantHeadteacher, Roles.Teacher), update);
router.delete("/:id", requireRoles(Roles.AssistantHeadteacher, Roles.Teacher), remove);

export default router;
