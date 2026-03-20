import mongoose from "mongoose";

const admissionPaymentSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reference: { type: String, required: true, unique: true }, // Removed index: true since we define it below
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["pending", "paid", "failed"], 
      default: "pending",
      index: true 
    },
    verified: { type: Boolean, default: false },
    method: { type: String, default: "paystack" },
    paidAt: { type: Date },
    webhookData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Index for efficient queries
admissionPaymentSchema.index({ applicantId: 1, parentId: 1 });
admissionPaymentSchema.index({ reference: 1 }, { unique: true });

export default mongoose.model("AdmissionPayment", admissionPaymentSchema);
