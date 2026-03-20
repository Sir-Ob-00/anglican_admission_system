import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { list } from "../controllers/activityLogController.js";

const router = Router();

router.use(authMiddleware);
router.get("/", requireRoles(Roles.Admin, Roles.Headteacher), list);

export default router;

