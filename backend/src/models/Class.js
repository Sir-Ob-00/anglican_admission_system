import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    capacity: { type: Number, default: 40 },
  },
  { timestamps: true }
);

export default mongoose.model("Class", classSchema);
