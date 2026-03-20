import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    classLevel: { type: String, required: true, trim: true, index: true },
    subjects: [{ type: String, trim: true }],
    supervisorTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", index: true },
    // Supervisor can be either a Teacher user or an Assistant Headteacher user.
    supervisorUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    scheduledAt: { type: Date },
    durationMinutes: { type: Number, default: 30 },
    passMark: { type: Number, default: 50 },
    status: { type: String, enum: ["draft", "scheduled", "active", "completed"], default: "draft", index: true },
    publishedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
