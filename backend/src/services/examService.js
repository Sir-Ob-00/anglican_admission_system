import ExamQuestion from "../models/ExamQuestion.js";

export async function gradeExam({ examId, answers }) {
  const questions = await ExamQuestion.find({ exam: examId }).lean();
  if (!questions.length) {
    return { score: 0, totalPoints: 0, percentage: 0, result: "failed", questions: [] };
  }

  let score = 0;
  let totalPoints = 0;

  for (const q of questions) {
    totalPoints += Number(q.points || 1);
    const raw = answers?.[String(q._id)];
    const pickedIndex = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(pickedIndex) && pickedIndex === q.correctIndex) {
      score += Number(q.points || 1);
    }
  }

  const percentage = totalPoints ? Math.round((score / totalPoints) * 1000) / 10 : 0;
  return { score, totalPoints, percentage, questions };
}

