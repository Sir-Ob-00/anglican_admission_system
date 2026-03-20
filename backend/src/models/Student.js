import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", unique: true, index: true },
    admissionNumber: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    classAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    parentUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
