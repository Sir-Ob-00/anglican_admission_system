import mongoose from "mongoose";

const backupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: ["created", "failed"], default: "created", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    notes: { type: String, trim: true },
    filePath: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Backup", backupSchema);
