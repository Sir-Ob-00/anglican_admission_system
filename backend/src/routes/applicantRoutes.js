import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import {
  createApplicant,
  deleteApplicant,
  getApplicant,
  listApplicants,
  updateApplicant,
} from "../controllers/applicantController.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  requireRoles(Roles.Headteacher, Roles.AssistantHeadteacher),
  createApplicant
);
router.get(
  "/",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  listApplicants
);
router.get(
  "/:id",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  getApplicant
);
router.put(
  "/:id",
  requireRoles(Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  updateApplicant
);
router.delete(
  "/:id",
  requireRoles(Roles.Headteacher),
  deleteApplicant
);

export default router;
