import api from "./api";

export async function listAssignedTeacherExams() {
  const res = await api.get("/teacher/exams/assigned");
  return res.data;
}

export async function getAssignedTeacherExam(id) {
  const res = await api.get(`/teacher/exams/assigned/${id}`);
  return res.data;
}

export async function startAssignedTeacherExamSession(id, payload) {
  const res = await api.post(`/teacher/exams/assigned/${id}/start`, payload);
  return res.data;
}

export async function getTeacherExamSession(sessionId) {
  const res = await api.get(`/teacher/exams/session/${sessionId}`);
  return res.data;
}

export async function heartbeatTeacherExamSession(sessionId, payload) {
  const res = await api.post(`/teacher/exams/session/${sessionId}/heartbeat`, payload);
  return res.data;
}

export async function submitTeacherExamSession(sessionId, payload) {
  const res = await api.post(`/teacher/exams/session/${sessionId}/submit`, payload);
  return res.data;
}

export async function resetTeacherExamSession(sessionId, payload) {
  const res = await api.post(`/teacher/exams/session/${sessionId}/reset`, payload);
  return res.data;
}
