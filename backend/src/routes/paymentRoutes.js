import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { Roles } from "../utils/roles.js";
import { 
  downloadReceipt, 
  listPayments, 
  verify,
  // NEW PAYSTACK ENDPOINTS
  initializeAdmissionPayment,
  handlePaystackWebhook,
  verifyManualPaymentSubmission,
  getPaymentSubmissions,
  getAdmissionPayments
} from "../controllers/paymentController.js";

const router = Router();

router.use(authMiddleware);

// NEW PAYSTACK-BASED PAYMENT ROUTES
router.post(
  "/initialize",
  requireRoles(Roles.Parent),
  initializeAdmissionPayment
);

// Webhook endpoint (no auth required - Paystack calls this directly)
router.post("/webhook", handlePaystackWebhook);

// Manual submission verification
router.post(
  "/verify-submission",
  requireRoles(Roles.AssistantHeadteacher, Roles.Headteacher),
  verifyManualPaymentSubmission
);

// Get payment submissions for admin review
router.get(
  "/submissions",
  requireRoles(Roles.AssistantHeadteacher, Roles.Headteacher),
  getPaymentSubmissions
);

// Get admission payments (filtered by role)
router.get(
  "/admission",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Parent),
  getAdmissionPayments
);

// LEGACY PAYMENT ROUTES (REMOVED - Parents now pay directly via Paystack)

// Get all payments (legacy - for admin reporting)
router.get(
  "/",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Parent),
  listPayments
);

// Verify payment (legacy - for manual verification)
router.post(
  "/verify",
  requireRoles(Roles.AssistantHeadteacher, Roles.Headteacher, Roles.Parent),
  verify
);

// Download receipt (legacy)
router.get(
  "/:id/receipt",
  requireRoles(Roles.Admin, Roles.Headteacher, Roles.AssistantHeadteacher, Roles.Parent),
  downloadReceipt
);

export default router;
