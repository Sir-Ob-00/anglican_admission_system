import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { create, download, list, restore } from "../controllers/backupController.js";

const router = Router();

router.use(authMiddleware);
router.post("/create", requireRoles(Roles.Admin, Roles.Headteacher), create);
router.get("/", requireRoles(Roles.Admin, Roles.Headteacher), list);
router.get("/:id/download", requireRoles(Roles.Admin, Roles.Headteacher), download);
router.post("/:id/restore", requireRoles(Roles.Admin), restore);

export default router;
