import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { listDocuments, listDocumentsForApplicant, uploadDocument, verifyDocument } from "../controllers/documentController.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/upload",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  upload.single("file"),
  uploadDocument
);

// Frontend-friendly alias
router.post(
  "/",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  upload.single("file"),
  uploadDocument
);

router.get(
  "/",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  listDocuments
);

router.get(
  "/:applicantId",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Teacher, Roles.Parent),
  listDocumentsForApplicant
);

router.put(
  "/:id/verify",
  requireRoles(Roles.Headteacher, Roles.AssistantHeadteacher),
  verifyDocument
);

export default router;
