import mongoose from "mongoose";

const parentStudentLinkSchema = new mongoose.Schema(
  {
    parentUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    linkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    linkedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

parentStudentLinkSchema.index({ parentUser: 1, student: 1 }, { unique: true });

export default mongoose.model("ParentStudentLink", parentStudentLinkSchema);

