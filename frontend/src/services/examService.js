import api from "./api";

// ============================================
// HEADTEACHER / TEACHER EXAM ENDPOINTS
// ============================================

export async function createHeadteacherExam(payload) {
  const res = await api.post("/headteacher/exam", payload);
  return res.data;
}

export async function saveHeadteacherExamDraft(payload) {
  const res = await api.post("/headteacher/exam/draft", payload);
  return res.data;
}

export async function updateHeadteacherExam(id, payload) {
  const res = await api.put(`/headteacher/exam/${id}`, payload);
  return res.data;
}

export async function getHeadteacherExam(id) {
  const res = await api.get(`/headteacher/exam/${id}`);
  return res.data;
}

export async function listHeadteacherExams(params) {
  const res = await api.get("/headteacher/exam", { params });
  return res.data;
}

export async function listAllHeadteacherExams(params) {
  const res = await api.get("/headteacher/exam/exams/all", { params });
  return res.data;
}

export async function assignHeadteacherExam(id, payload) {
  const res = await api.post(`/headteacher/exam/${id}/assign`, payload);
  return res.data;
}

export async function initiateHeadteacherExamForApplicant(payload) {
  const res = await api.post("/headteacher/exam/initiate-for-applicant", payload);
  return res.data;
}

export async function deleteHeadteacherExam(id) {
  const res = await api.delete(`/headteacher/exam/${id}`);
  return res.data;
}

export async function submitHeadteacherExam(id, payload) {
  const res = await api.post(`/headteacher/exam/${id}/submit`, payload);
  return res.data;
}
