import Applicant from "../models/Applicant.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import ClassModel from "../models/Class.js";
import Payment from "../models/Payment.js";
import ExamResult from "../models/ExamResult.js";
import Admission from "../models/Admission.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import Exam from "../models/Exam.js";
import Document from "../models/Document.js";
import { Roles } from "../utils/roles.js";

export async function summary(req, res, next) {
  try {
    const [
      totalApplicants,
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalPayments,
      pendingReviews,
      examsCompleted,
      admitted,
      unreadNotifications,
      applicantsByClass,
      admissionsByClass,
    ] = await Promise.all([
      Applicant.countDocuments(),
      Student.countDocuments(),
      Teacher.countDocuments(),
      Parent.countDocuments(),
      ClassModel.countDocuments(),
      Payment.countDocuments(),
      Applicant.countDocuments({ status: "pending_review" }),
      ExamResult.countDocuments(),
      Admission.countDocuments(),
      Notification.countDocuments({ user: req.user._id, read: false }),
      Applicant.aggregate([
        { $group: { _id: "$classApplyingFor", count: { $sum: 1 } } },
        { $project: { _id: 0, class: "$_id", count: 1 } },
      ]),
      Admission.aggregate([
        {
          $lookup: {
            from: "applicants",
            localField: "applicant",
            foreignField: "_id",
            as: "applicant",
          },
        },
        { $unwind: "$applicant" },
        { $group: { _id: "$applicant.classApplyingFor", count: { $sum: 1 } } },
        { $project: { _id: 0, class: "$_id", count: 1 } },
      ]),
    ]);

    const admissionRate = totalApplicants ? Math.round((admitted / totalApplicants) * 1000) / 10 : 0;

    res.json({
      totals: {
        totalApplicants,
        totalStudents,
        totalTeachers,
        totalParents,
        totalClasses,
        totalPayments,
      },
      workflow: {
        pendingReviews,
        examsCompleted,
        admitted,
        admissionRate,
      },
      notifications: { unread: unreadNotifications },
      applicantsByClass,
      admissionsByClass,
    });
  } catch (e) {
    next(e);
  }
}

export async function headteacherSummary(req, res, next) {
  try {
    const [
      totalApplicants,
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalPayments,
      pendingReview,
      examsCompleted,
      examsPending,
      paymentsCompleted,
      admissionsCompleted,
      unreadNotifications,
      recentActivity,
      applicantsByClass,
    ] = await Promise.all([
      Applicant.countDocuments(),
      Student.countDocuments(),
      Teacher.countDocuments(),
      Parent.countDocuments(),
      ClassModel.countDocuments(),
      Payment.countDocuments(),
      Applicant.countDocuments({ status: "pending_review" }),
      ExamResult.countDocuments(),
      Applicant.countDocuments({ status: "exam_scheduled" }),
      Payment.countDocuments({ status: "verified" }),
      Admission.countDocuments(),
      Notification.countDocuments({ user: req.user._id, read: false }),
      ActivityLog.find({})
        .populate("user", "name username role")
        .sort({ timestamp: -1 })
        .limit(8)
        .lean(),
      Applicant.aggregate([
        { $group: { _id: "$classApplyingFor", count: { $sum: 1 } } },
        { $project: { _id: 0, class: "$_id", count: 1 } },
      ]),
    ]);

    const admissionsByClass = await Admission.aggregate([
      {
        $lookup: {
          from: "applicants",
          localField: "applicant",
          foreignField: "_id",
          as: "applicant",
        },
      },
      { $unwind: "$applicant" },
      { $group: { _id: "$applicant.classApplyingFor", count: { $sum: 1 } } },
      { $project: { _id: 0, class: "$_id", count: 1 } },
    ]);

    const scheduledExams = await Exam.find({ status: { $in: ["scheduled", "active"] } })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean();

    res.json({
      totals: {
        totalApplicants,
        totalStudents,
        totalTeachers,
        totalParents,
        totalClasses,
        totalPayments,
      },
      workflow: {
        pendingReview,
        examsCompleted,
        examsPending,
        paymentsCompleted,
        admissionsCompleted,
      },
      notifications: { unread: unreadNotifications },
      recentActivity,
      scheduledExams,
      applicantsByClass,
      admissionsByClass,
    });
  } catch (e) {
    next(e);
  }
}

export async function assistantSummary(req, res, next) {
  try {
    const [
      totalApplicants,
      totalStudents,
      waitingExam,
      examsConducted,
      pendingExamReviews,
      paymentsPending,
      teachers,
      recentActions,
    ] = await Promise.all([
      Applicant.countDocuments(),
      Student.countDocuments(),
      Applicant.countDocuments({ status: "exam_scheduled" }),
      ExamResult.countDocuments(),
      ExamResult.countDocuments({ finalDecision: { $exists: false } }),
      Applicant.countDocuments({ paymentStatus: "awaiting_payment" }),
      Teacher.countDocuments(),
      ActivityLog.find({})
        .populate("user", "name username role")
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      totals: { totalApplicants, totalStudents, teachers },
      workflow: {
        waitingExam,
        examsConducted,
        pendingExamReviews,
        paymentsPending,
      },
      recentActions,
    });
  } catch (e) {
    next(e);
  }
}

export async function teacherSummary(req, res, next) {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id }).select("_id").lean();
    if (!teacher) {
      return res.json({
        teacher: { assignedClass: null },
        totals: { students: 0, teachers: await Teacher.countDocuments() },
        workflow: { assignedExams: 0, examsCompleted: 0, applicantsAssigned: 0, studentsInAssignedClass: 0 },
        recentActions: [],
      });
    }

    const assignedClass = await ClassModel.findOne({ teacher: teacher._id }).select("_id name").lean();
    const assignedClassId = assignedClass?._id;

    const [teachersCount, studentsInAssignedClass, assignedExams, examsCompleted, applicantsAssigned, recentActions] = await Promise.all([
      Teacher.countDocuments(),
      assignedClassId ? Student.countDocuments({ classAssigned: assignedClassId }) : Promise.resolve(0),
      Exam.countDocuments({ supervisorTeacher: teacher._id }),
      (async () => {
        const exams = await Exam.find({ supervisorTeacher: teacher._id }).select("_id").lean();
        const examIds = exams.map((e) => e._id);
        return ExamResult.countDocuments({ exam: { $in: examIds } });
      })(),
      (async () => {
        const exams = await Exam.find({ supervisorTeacher: teacher._id }).select("_id").lean();
        const examIds = exams.map((e) => e._id);
        return Applicant.countDocuments({ exam: { $in: examIds } });
      })(),
      ActivityLog.find({ user: req.user._id })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalStudents = await Student.countDocuments();

    res.json({
      teacher: { assignedClass: assignedClass || null },
      totals: { students: totalStudents, teachers: teachersCount },
      workflow: { assignedExams, examsCompleted, applicantsAssigned, studentsInAssignedClass },
      recentActions,
    });
  } catch (e) {
    next(e);
  }
}

export async function parentSummary(req, res, next) {
  try {
    const directApplicants = await Applicant.find({ parentUser: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const students = await Student.find({ parentUser: req.user._id }).select("applicant").lean();
    const linkedApplicantIds = students.map((s) => s.applicant).filter(Boolean);

    let applicants = directApplicants;
    if (linkedApplicantIds.length) {
      const linkedApplicants = await Applicant.find({ _id: { $in: linkedApplicantIds } }).lean();
      const byId = new Map(directApplicants.map((a) => [String(a._id), a]));
      for (const a of linkedApplicants) byId.set(String(a._id), a);
      applicants = Array.from(byId.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const applicantIds = applicants.map((a) => a._id);
    const latest = applicants[0] || null;

    const [docsCount, paymentsVerified, paymentsTotal, admittedCount, unreadNotifications] =
      await Promise.all([
        Document.countDocuments({ applicant: { $in: applicantIds } }),
        Payment.countDocuments({ applicant: { $in: applicantIds }, status: "verified" }),
        Payment.countDocuments({ applicant: { $in: applicantIds } }),
        Admission.countDocuments({ applicant: { $in: applicantIds } }),
        Notification.countDocuments({ user: req.user._id, read: false }),
      ]);

    // Get class and teacher information for the latest applicant
    let classInfo = null;
    let teacherInfo = null;
    
    if (latest && latest.classApplyingFor) {
      try {
        const classData = await ClassModel.findOne({ name: latest.classApplyingFor })
          .populate({
            path: "teacher",
            populate: {
              path: "user",
              select: "name"
            }
          })
          .lean();
        
        if (classData) {
          classInfo = classData.name;
          teacherInfo = classData.teacher?.user?.name || classData.teacher?.name || null;
        }
      } catch (error) {
        console.error("Error fetching class/teacher info:", error);
      }
    }

    const stageCounts = applicants.reduce(
      (acc, a) => {
        const s = String(a.status || "");
        if (s === "pending_review") acc.pendingReview++;
        else if (s === "exam_scheduled") acc.examScheduled++;
        else if (s === "exam_completed") acc.examCompleted++;
        else if (s === "exam_passed") acc.examPassed++;
        else if (s === "awaiting_payment") acc.paymentPending++;
        else if (s === "payment_completed") acc.paymentCompleted++;
        else if (s === "admitted") acc.admitted++;
        else if (s === "rejected") acc.rejected++;
        return acc;
      },
      {
        pendingReview: 0,
        examScheduled: 0,
        examCompleted: 0,
        examPassed: 0,
        paymentPending: 0,
        paymentCompleted: 0,
        admitted: 0,
        rejected: 0,
      }
    );

    res.json({
      totals: {
        applicants: applicants.length,
        documentsSubmitted: docsCount,
        paymentsTotal,
        paymentsVerified,
        admissions: admittedCount,
      },
      stages: stageCounts,
      latestApplicant: latest
        ? {
            _id: latest._id, // Changed from 'id' to '_id'
            fullName: latest.fullName,
            classApplyingFor: latest.classApplyingFor,
            status: latest.status,
            paymentStatus: latest.paymentStatus,
            examScore: latest.examScore,
            createdAt: latest.createdAt,
            assignedClass: classInfo,
            teacherName: teacherInfo,
          }
        : null,
      notifications: { unread: unreadNotifications },
      role: Roles.Parent,
    });
  } catch (e) {
    next(e);
  }
}
