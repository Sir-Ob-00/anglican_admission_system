import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", index: true },
    fullName: { type: String, trim: true },

    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    percentage: { type: Number, required: true },
    result: { type: String, enum: ["passed", "failed"], required: true, index: true },

    // Optional manual scoring portion (e.g. essay questions).
    manualScore: { type: Number, default: 0 },
    manualTotalPoints: { type: Number, default: 0 },
    overallScore: { type: Number },
    overallTotalPoints: { type: Number },
    overallPercentage: { type: Number },

    answers: { type: Object, default: {} },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date, default: Date.now },

    submissionMeta: {
      ipAddress: { type: String, trim: true },
      userAgent: { type: String, trim: true },
      startIpAddress: { type: String, trim: true },
      startUserAgent: { type: String, trim: true },
      ipConsistent: { type: Boolean, default: true },
      entranceSession: { type: mongoose.Schema.Types.ObjectId, ref: "EntranceExamSession" },
    },

    teacherAssessment: {
      recommendation: { type: String, enum: ["pass", "fail", "borderline"] },
      note: { type: String, trim: true },
      manualScore: { type: Number },
      manualTotalPoints: { type: Number },
      assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      assessedAt: { type: Date },
    },

    assistantRecommendation: {
      recommendedResult: { type: String, enum: ["passed", "failed"] },
      note: { type: String, trim: true },
      recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      recommendedAt: { type: Date },
    },
    finalDecision: { type: String, enum: ["approve", "reject", "reexam"], index: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("ExamResult", examResultSchema);
