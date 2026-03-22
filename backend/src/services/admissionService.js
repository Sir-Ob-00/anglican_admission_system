import mongoose from "mongoose";
import Applicant from "../models/Applicant.js";
import Admission from "../models/Admission.js";
import Student from "../models/Student.js";
import Payment from "../models/Payment.js";
import { generateAdmissionNumber } from "../utils/generateAdmissionNumber.js";

export async function approveAdmission({ applicantId, approvedBy, classAssigned }) {
  const applicant = await Applicant.findById(applicantId);
  if (!applicant) throw new Error("Applicant not found");

  if (classAssigned && !mongoose.Types.ObjectId.isValid(classAssigned)) {
    throw new Error("Invalid classAssigned id");
  }

  if (applicant.status !== "payment_completed" && applicant.paymentStatus !== "payment_completed") {
    const verifiedPayment = await Payment.findOne({ applicant: applicant._id, status: "verified" })
      .select("_id")
      .lean();
    if (verifiedPayment) {
      applicant.status = "payment_completed";
      applicant.paymentStatus = "payment_completed";
      await applicant.save();
    } else {
      throw new Error("Applicant is not eligible for admission approval (payment not completed)");
    }
  }

  const existingAdmission = await Admission.findOne({ applicant: applicant._id }).select("_id").lean();
  if (existingAdmission) throw new Error("Applicant is already admitted");

  const existingStudent = await Student.findOne({ applicant: applicant._id }).select("_id").lean();
  if (existingStudent) throw new Error("Student record already exists for this applicant");

  const admissionNumber = generateAdmissionNumber();

  const admission = await Admission.create({
    applicant: applicant._id,
    admissionNumber,
    approvedBy,
    approvedAt: new Date(),
  });

  applicant.status = "admitted";
  applicant.admissionStatus = "admitted";
  await applicant.save();

  await Student.create({
    applicant: applicant._id,
    admissionNumber,
    fullName: applicant.fullName,
    classAssigned: classAssigned || undefined,
    parentUser: applicant.parentUser,
    
    // Personal information from applicant
    dateOfBirth: applicant.dateOfBirth,
    gender: applicant.gender,
    admittedClass: classAssigned?.name || applicant.classApplyingFor,
    
    // Parent information from applicant
    parentContact: applicant.parentContact || (applicant.parentUser?.contact || ''),
    parentName: applicant.parentName || (applicant.parentUser?.name || ''),
    address: applicant.address || '',
    
    // Location information (default empty - to be filled later)
    homeTown: '',
    currentLocation: '',
    nationality: '',
    region: '',
    
    // Profile picture (default empty)
    profilePicture: '',
  });

  return { admission, applicant };
}
