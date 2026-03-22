import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", unique: true, index: true },
    admissionNumber: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    classAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    parentUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Additional personal information
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    admittedClass: { type: String, required: true, trim: true },
    
    // Parent information
    parentContact: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    
    // Additional location information
    homeTown: { type: String, trim: true },
    currentLocation: { type: String, trim: true },
    nationality: { type: String, trim: true },
    region: { type: String, trim: true },
    
    // Profile picture
    profilePicture: { type: String, trim: true }, // URL or file path
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
