import Payment from "../models/Payment.js";
import AdmissionPayment from "../models/AdmissionPayment.js";
import PaymentSubmission from "../models/PaymentSubmission.js";
import { requireFields } from "../utils/validators.js";
import { initiatePayment, verifyPayment } from "../services/paymentService.js";
import { initializePaystackPayment, verifyPaystackTransaction, verifyWebhookSignature, generatePaymentReference } from "../services/paystackService.js";
import { createNotification } from "../services/notificationService.js";
import { logActivity } from "../services/activityLogService.js";
import Applicant from "../models/Applicant.js";
import User from "../models/User.js";
import { Roles } from "../utils/roles.js";

// NEW PAYSTACK-BASED PAYMENT FLOW

export async function initializeAdmissionPayment(req, res, next) {
  try {
    const missing = requireFields(req.body, ["applicantId"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    // Get applicant details
    const applicant = await Applicant.findById(req.body.applicantId).populate('parentUser', 'email').lean();
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    // Check if user is the parent or has permission
    if (req.user?.role === Roles.Parent && String(applicant.parentUser?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only pay for your own applicants" });
    }

    // Check if payment already exists
    const existingPayment = await AdmissionPayment.findOne({ 
      applicantId: applicant._id, 
      status: { $in: ['pending', 'paid'] } 
    });
    if (existingPayment) {
      return res.status(400).json({ 
        message: existingPayment.status === 'paid' ? 'Payment already completed' : 'Payment already initiated' 
      });
    }

    // Generate unique reference
    const reference = generatePaymentReference();
    
    // Admission fee amount (can be moved to config)
    const amount = 50000; // 500.00 in local currency

    // Initialize Paystack payment
    const paystackResponse = await initializePaystackPayment({
      email: applicant.parentUser?.email || req.user.email,
      amount,
      reference,
      metadata: {
        applicantId: applicant._id.toString(),
        parentId: applicant.parentUser?._id?.toString() || req.user._id.toString(),
      },
    });

    // Create admission payment record
    const admissionPayment = await AdmissionPayment.create({
      applicantId: applicant._id,
      parentId: applicant.parentUser?._id || req.user._id,
      reference,
      amount,
      status: 'pending',
      method: 'paystack',
    });

    // Update applicant payment status
    await Applicant.findByIdAndUpdate(applicant._id, {
      paymentStatus: 'awaiting_payment',
    });

    await logActivity({ 
      userId: req.user._id, 
      action: "Initialized admission payment", 
      ipAddress: req.ip, 
      meta: { 
        applicantId: applicant._id, 
        reference,
        amount 
      } 
    });

    res.json({
      authorization_url: paystackResponse.data.authorization_url,
      reference,
      amount,
    });
  } catch (e) {
    next(e);
  }
}

export async function handlePaystackWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const payload = req.body;

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    // Only process successful charges
    if (payload.event !== 'charge.success') {
      return res.status(200).json({ ok: true }); // Acknowledge other events
    }

    const { data } = payload;
    const reference = data.reference;

    // Check if payment already processed
    const existingPayment = await AdmissionPayment.findOne({ reference });
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (existingPayment.verified) {
      return res.status(200).json({ ok: true }); // Already processed
    }

    // Verify transaction with Paystack
    const verificationResponse = await verifyPaystackTransaction(reference);
    const transactionData = verificationResponse.data;

    if (transactionData.status === 'success') {
      // Update payment record
      await AdmissionPayment.findByIdAndUpdate(existingPayment._id, {
        status: 'paid',
        verified: true,
        paidAt: new Date(),
        webhookData: payload,
      });

      // Update applicant status
      await Applicant.findByIdAndUpdate(existingPayment.applicantId, {
        paymentStatus: 'payment_completed',
      });

      // Send notification to parent
      await createNotification({
        userId: existingPayment.parentId,
        applicantId: existingPayment.applicantId,
        type: 'payment',
        message: 'Payment successful! Your admission fee has been received.',
      });

      await logActivity({ 
        userId: existingPayment.parentId, 
        action: "Payment completed via webhook", 
        ipAddress: req.ip, 
        meta: { 
          applicantId: existingPayment.applicantId, 
          reference,
          amount: transactionData.amount / 100,
        } 
      });
    } else {
      // Mark as failed
      await AdmissionPayment.findByIdAndUpdate(existingPayment._id, {
        status: 'failed',
        webhookData: payload,
      });
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}

export async function verifyManualPaymentSubmission(req, res, next) {
  try {
    const missing = requireFields(req.body, ["submissionId"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const submission = await PaymentSubmission.findById(req.body.submissionId)
      .populate('applicantId', 'fullName parentUser')
      .lean();
    
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (submission.status !== 'pending') {
      return res.status(400).json({ message: "Submission already processed" });
    }

    // Verify with Paystack if reference exists
    let verified = false;
    if (submission.reference) {
      try {
        const verificationResponse = await verifyPaystackTransaction(submission.reference);
        verified = verificationResponse.data.status === 'success';
      } catch (error) {
        console.error('Verification failed:', error);
      }
    }

    if (verified) {
      // Create admission payment record
      await AdmissionPayment.create({
        applicantId: submission.applicantId._id,
        parentId: submission.applicantId.parentUser,
        reference: submission.reference,
        amount: 50000, // Default amount
        status: 'paid',
        verified: true,
        method: 'paystack',
        paidAt: new Date(),
      });

      // Update applicant
      await Applicant.findByIdAndUpdate(submission.applicantId._id, {
        paymentStatus: 'payment_completed',
      });

      // Update submission
      await PaymentSubmission.findByIdAndUpdate(submission._id, {
        status: 'approved',
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
      });

      // Send notification
      await createNotification({
        userId: submission.applicantId.parentUser,
        applicantId: submission.applicantId._id,
        type: 'payment',
        message: 'Your payment submission has been verified and approved.',
      });
    } else {
      // Mark as rejected
      await PaymentSubmission.findByIdAndUpdate(submission._id, {
        status: 'rejected',
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        notes: req.body.notes || 'Payment could not be verified',
      });
    }

    await logActivity({ 
      userId: req.user._id, 
      action: "Verified manual payment submission", 
      ipAddress: req.ip, 
      meta: { 
        submissionId: submission._id,
        verified,
      } 
    });

    res.json({ verified, message: verified ? 'Payment verified and approved' : 'Payment rejected' });
  } catch (e) {
    next(e);
  }
}

export async function getPaymentSubmissions(req, res, next) {
  try {
    const submissions = await PaymentSubmission.find({ status: 'pending' })
      .populate('applicantId', 'fullName classApplyingFor parentUser')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: submissions });
  } catch (e) {
    next(e);
  }
}

export async function getAdmissionPayments(req, res, next) {
  try {
    const filter = {};
    
    // Parents can only see their own payments
    if (req.user?.role === Roles.Parent) {
      filter.parentId = req.user._id;
    }

    const payments = await AdmissionPayment.find(filter)
      .populate('applicantId', 'fullName classApplyingFor')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: payments });
  } catch (e) {
    next(e);
  }
}

// LEGACY PAYMENT FUNCTIONS (KEEP FOR BACKWARDS COMPATIBILITY)

export async function listPayments(req, res, next) {
  try {
    const filter = {};
    // Parents should only see payments for applicants linked to them.
    if (req.user?.role === "parent") {
      const applicants = await Applicant.find({ parentUser: req.user._id }).select("_id").lean();
      filter.applicant = { $in: applicants.map((a) => a._id) };
    }
    const items = await Payment.find(filter)
      .populate("applicant", "fullName classApplyingFor parentUser")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function initiate(req, res, next) {
  try {
    const missing = requireFields(req.body, ["applicantId", "amount"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const payment = await initiatePayment({
      applicantId: req.body.applicantId,
      amount: Number(req.body.amount),
      method: req.body.method || "bank_transfer",
      initiatedBy: req.user?._id,
      initiatedByRole: req.user?.role,
    });

    const applicant = await Applicant.findById(req.body.applicantId).lean();
    await createNotification({
      userId: applicant?.parentUser,
      applicantId: applicant?._id,
      type: "payment",
      message: "Payment request initiated. Please complete payment.",
    });

    await logActivity({ userId: req.user?._id, action: "Initiated payment", ipAddress: req.ip, meta: { paymentId: payment._id } });
    res.status(201).json(payment);
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("payment can only be initiated")) {
      return res.status(400).json({ message: msg });
    }
    if (msg.toLowerCase().includes("applicant not found")) {
      return res.status(404).json({ message: msg });
    }
    next(e);
  }
}

export async function verify(req, res, next) {
  try {
    const missing = requireFields(req.body, ["paymentId"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    // If a parent is verifying, ensure payment belongs to their applicant.
    if (req.user?.role === "parent") {
      const p = await Payment.findById(req.body.paymentId).lean();
      if (!p) return res.status(404).json({ message: "Payment not found" });
      const a = await Applicant.findById(p.applicant).lean();
      if (String(a?.parentUser || "") !== String(req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const payment = await verifyPayment({ paymentId: req.body.paymentId, paidBy: req.user?._id });

    const applicant = await Applicant.findById(payment.applicant).lean();
    await createNotification({
      userId: applicant?.parentUser,
      applicantId: applicant?._id,
      type: "payment",
      message: "Payment successful.",
    });

    await logActivity({ userId: req.user?._id, action: "Verified payment", ipAddress: req.ip, meta: { paymentId: payment._id } });
    res.json(payment);
  } catch (e) {
    next(e);
  }
}

export async function downloadReceipt(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id).populate("applicant", "fullName parentUser classApplyingFor").lean();
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (req.user?.role === Roles.Parent) {
      if (String(payment.applicant?.parentUser || "") !== String(req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const filename = `receipt_${payment.reference || payment._id}.txt`;
    const lines = [
      "Anglican School Admission Management System",
      "Payment Receipt",
      "----------------------------------------",
      `Receipt Ref: ${payment.reference || payment._id}`,
      `Applicant: ${payment.applicant?.fullName || "—"}`,
      `Class: ${payment.applicant?.classApplyingFor || "—"}`,
      `Amount: ${payment.amount}`,
      `Method: ${payment.method}`,
      `Status: ${payment.status}`,
      `Paid At: ${payment.paidAt ? new Date(payment.paidAt).toISOString() : "—"}`,
      `Generated At: ${new Date().toISOString()}`,
      "",
    ];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(lines.join("\n"));
  } catch (e) {
    next(e);
  }
}
