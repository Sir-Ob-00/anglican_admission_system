import mongoose from "mongoose";

const paymentSubmissionSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    reference: { type: String, required: true, unique: true, index: true },
    proofImage: { type: String, required: true }, // URL or path to proof image
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending",
      index: true 
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentSubmission", paymentSubmissionSchema);
