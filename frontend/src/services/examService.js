import api from "./api";

export async function listExams(params) {
  const res = await api.get("/api/exams", { params });
  return res.data;
}

export async function getExam(id) {
  const res = await api.get(`/api/exams/${id}`);
  return res.data;
}

export async function createExam(payload) {
  const res = await api.post("/api/exams", payload);
  return res.data;
}

export async function updateExam(id, payload) {
  const res = await api.put(`/api/exams/${id}`, payload);
  return res.data;
}

export async function getExamQuestions(id, params) {
  const res = await api.get(`/api/exams/${id}/questions`, { params });
  return res.data;
}

export async function assignExamToApplicant(applicantId, examId) {
  const res = await api.post(`/api/exams/assign/applicant/${applicantId}`, { examId });
  return res.data;
}

export async function assignExamToApplicantWithSupervisor(applicantId, { examId, supervisorUserId }) {
  const res = await api.post(`/api/exams/assign/applicant/${applicantId}`, { examId, supervisorUserId });
  return res.data;
}

export async function assignExamSupervisor(examId, payload) {
  const res = await api.put(`/api/exams/${examId}/supervisor`, payload);
  return res.data;
}

export async function publishEntranceExam(examId) {
  const res = await api.post(`/api/exams/${examId}/publish`);
  return res.data;
}

export async function submitExam(payload) {
  const res = await api.post("/api/exams/submit", payload);
  return res.data;
}
