import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", index: true },
    type: { type: String, enum: ["exam", "payment", "admission", "system"], default: "system", index: true },
    message: { type: String, required: true, trim: true },
    link: {
      url: { type: String, trim: true },
      label: { type: String, trim: true },
    },
    read: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default mongoose.model("Notification", notificationSchema);
