import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, unique: true, index: true },
    admissionNumber: { type: String, required: true, unique: true, index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    approvedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Admission", admissionSchema);
