import mongoose from "mongoose";

export const ApplicantStatuses = Object.freeze([
  "pending_review",
  "exam_scheduled",
  "exam_completed",
  "exam_passed",
  "exam_failed",
  "awaiting_payment",
  "payment_completed",
  "admitted",
  "rejected",
]);

const applicantSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    classApplyingFor: { type: String, required: true, trim: true, index: true },

    parentUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    parentName: { type: String, trim: true },
    address: { type: String, trim: true },
    parentContact: { type: String, trim: true },

    status: { type: String, enum: ApplicantStatuses, default: "pending_review", index: true },

    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    examAssignedAt: { type: Date },
    examScore: { type: Number, default: null },
    paymentStatus: { type: String, enum: ["none", "awaiting_payment", "payment_completed"], default: "none", index: true },
    admissionStatus: { type: String, enum: ["none", "admitted", "rejected"], default: "none", index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Applicant", applicantSchema);
