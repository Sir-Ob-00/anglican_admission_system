import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { createUser, deactivateUser, getUser, listUsers, updateUser } from "../controllers/userController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRoles(Roles.Admin, Roles.Headteacher), listUsers);
router.post("/", requireRoles(Roles.Admin), createUser);
router.get("/:id", requireRoles(Roles.Admin, Roles.Headteacher), getUser);
router.put("/:id", requireRoles(Roles.Admin), updateUser);
router.delete("/:id", requireRoles(Roles.Admin), deactivateUser);

export default router;

