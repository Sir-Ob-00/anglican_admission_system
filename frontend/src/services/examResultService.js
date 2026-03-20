import api from "./api";

export async function listExamResults(params) {
  const res = await api.get("/api/exam-results", { params });
  return res.data;
}

export async function decideExamResult(examResultId, decision) {
  const res = await api.post(`/api/exams/results/${examResultId}/decision`, { decision });
  return res.data;
}

export async function recommendExamResult(examResultId, recommendedResult, note) {
  const res = await api.post(`/api/exams/results/${examResultId}/recommendation`, {
    recommendedResult,
    note,
  });
  return res.data;
}

export async function teacherAssessExamResult(examResultId, payload) {
  const res = await api.post(`/api/exams/results/${examResultId}/teacher-assessment`, payload);
  return res.data;
}
