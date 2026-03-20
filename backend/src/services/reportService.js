import Applicant from "../models/Applicant.js";
import ExamResult from "../models/ExamResult.js";
import Admission from "../models/Admission.js";
import Payment from "../models/Payment.js";

export async function buildReports() {
  const applicantsByClass = await Applicant.aggregate([
    { $group: { _id: "$classApplyingFor", count: { $sum: 1 } } },
    { $project: { _id: 0, class: "$_id", count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const examPerformance = await ExamResult.aggregate([
    { $group: { _id: "$result", count: { $sum: 1 }, avgPct: { $avg: "$percentage" } } },
    { $project: { _id: 0, result: "$_id", count: 1, avgPct: { $round: ["$avgPct", 1] } } },
  ]);

  const admissionStats = await Admission.countDocuments();

  const paymentsSummary = await Payment.aggregate([
    { $match: { status: "verified" } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $project: { _id: 0, total: 1, count: 1 } },
  ]);

  return {
    applicantsByClass,
    examPerformance,
    admissionStats: { admitted: admissionStats },
    paymentsSummary: paymentsSummary[0] || { total: 0, count: 0 },
  };
}

