import Payment from "../models/Payment.js";
import Applicant from "../models/Applicant.js";
import ExamResult from "../models/ExamResult.js";
import { Roles } from "../utils/roles.js";

export async function initiatePayment({ applicantId, amount, method, initiatedBy, initiatedByRole }) {
  const applicant = await Applicant.findById(applicantId).lean();
  if (!applicant) throw new Error("Applicant not found");
  const status = String(applicant.status || "");
  if (status !== "exam_passed") {
    const latestResult = await ExamResult.findOne({ applicant: applicantId })
      .sort({ createdAt: -1 })
      .select("result finalDecision assistantRecommendation")
      .lean();
    const isPassed = latestResult?.result === "passed";
    const assistantApproved = latestResult?.assistantRecommendation?.recommendedResult === "passed";
    const headApproved = latestResult?.finalDecision === "approve";
    const assistantFlowOk = initiatedByRole === Roles.AssistantHeadteacher && isPassed;
    if (!(headApproved || assistantApproved || assistantFlowOk)) {
      throw new Error("Payment can only be initiated after the entrance exam is passed");
    }
  }

  const payment = await Payment.create({
    applicant: applicantId,
    amount,
    method,
    status: "initiated",
    initiatedBy,
    reference: `PAY_${Date.now()}`,
  });

  await Applicant.findByIdAndUpdate(applicantId, {
    paymentStatus: "awaiting_payment",
    status: "awaiting_payment",
  });

  return payment;
}

export async function verifyPayment({ paymentId, paidBy }) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error("Payment not found");

  payment.status = "verified";
  payment.paidBy = paidBy;
  payment.paidAt = new Date();
  await payment.save();

  await Applicant.findByIdAndUpdate(payment.applicant, {
    paymentStatus: "payment_completed",
    status: "payment_completed",
  });

  return payment;
}
