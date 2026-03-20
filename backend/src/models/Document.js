import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    documentType: {
      type: String,
      enum: ["birth_certificate", "passport_photo", "medical_record", "other"],
      required: true,
      index: true,
    },
    filePath: { type: String, required: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    verified: { type: Boolean, default: false, index: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
