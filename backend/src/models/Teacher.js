import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    staffId: { type: String, trim: true, index: true },
    subject: { type: String, trim: true },
    assignedClass: { type: String, trim: true, index: true }, // e.g., "JHS1A", "JHS1B"
  },
  { timestamps: true }
);

export default mongoose.model("Teacher", teacherSchema);
