import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["bank_transfer", "card", "cash"], default: "bank_transfer" },
    status: { type: String, enum: ["initiated", "verified", "failed"], default: "initiated", index: true },

    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    paidAt: { type: Date },
    reference: { type: String, trim: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
