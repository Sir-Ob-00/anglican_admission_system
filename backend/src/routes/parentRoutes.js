import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { create, linkParentToStudent, list, update } from "../controllers/parentController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher), list);
router.post("/", requireRoles(Roles.Admin, Roles.Headteacher), create);
router.put("/:id", requireRoles(Roles.Admin, Roles.Headteacher), update);
router.post("/link-student", requireRoles(Roles.Headteacher), linkParentToStudent);

export default router;
