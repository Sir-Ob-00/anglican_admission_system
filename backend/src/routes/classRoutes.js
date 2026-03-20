import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { create, list, update } from "../controllers/classController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher), list);
router.post("/", requireRoles(Roles.Admin, Roles.Headteacher), create);
router.put("/:id", requireRoles(Roles.Admin, Roles.Headteacher), update);

export default router;

