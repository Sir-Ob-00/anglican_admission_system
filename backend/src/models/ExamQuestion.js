import mongoose from "mongoose";

const examQuestionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    subject: { type: String, enum: ["English", "Maths"], required: true, index: true },
    text: { type: String, required: true, trim: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("ExamQuestion", examQuestionSchema);
