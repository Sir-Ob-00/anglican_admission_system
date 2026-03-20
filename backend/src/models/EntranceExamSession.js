import mongoose from "mongoose";

const entranceExamSessionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    sessionToken: { type: String, required: true, unique: true, index: true, trim: true },
    fullName: { type: String, trim: true },
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "ExamQuestion" }],

    status: {
      type: String,
      enum: ["active", "completed", "blocked"],
      default: "active",
      index: true,
    },

    startedAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    blockedAt: { type: Date },

    startedIpAddress: { type: String, trim: true },
    currentIpAddress: { type: String, trim: true },
    startedUserAgent: { type: String, trim: true },
    currentUserAgent: { type: String, trim: true },

    blockReason: { type: String, trim: true },
    ipChangeEvents: [
      {
        detectedAt: { type: Date, default: Date.now },
        ipAddress: { type: String, trim: true },
        userAgent: { type: String, trim: true },
      },
    ],
  },
  { timestamps: false }
);

entranceExamSessionSchema.index({ exam: 1, applicant: 1, status: 1 });

export default mongoose.model("EntranceExamSession", entranceExamSessionSchema);
