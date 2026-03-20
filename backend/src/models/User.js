import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ALL_ROLES, Roles } from "../utils/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true, sparse: true },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ALL_ROLES, default: Roles.Parent, index: true },
    isActive: { type: Boolean, default: true, index: true },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(String(password || ""), this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(String(password || ""), saltRounds);
};

export default mongoose.model("User", userSchema);
