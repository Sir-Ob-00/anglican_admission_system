import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { approve, downloadConfirmation, get, list, reject } from "../controllers/admissionController.js";

const router = Router();

router.use(authMiddleware);

router.post("/approve", requireRoles(Roles.Headteacher), approve);
router.post("/reject", requireRoles(Roles.Headteacher), reject);
router.get("/", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher), list);
router.get(
  "/applicant/:applicantId/confirmation",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Parent),
  downloadConfirmation
);
router.get("/:id", requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher), get);

export default router;
