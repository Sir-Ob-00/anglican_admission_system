import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { create, list, resetPassword, setActive, update } from "../controllers/teacherController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher), list);
router.post("/", requireRoles(Roles.Admin, Roles.Headteacher), create);
router.put("/:id", requireRoles(Roles.Admin, Roles.Headteacher), update);
router.put("/:id/activate", requireRoles(Roles.Admin), (req, res, next) => {
  req.body.isActive = true;
  return setActive(req, res, next);
});
router.put("/:id/deactivate", requireRoles(Roles.Admin), (req, res, next) => {
  req.body.isActive = false;
  return setActive(req, res, next);
});
router.post("/:id/reset-password", requireRoles(Roles.Admin), resetPassword);

export default router;
