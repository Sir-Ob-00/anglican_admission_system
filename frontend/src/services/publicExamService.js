import api from "./api";

export async function getPublicExam(id) {
  const res = await api.get(`/api/public/exams/${id}`);
  return res.data;
}

export async function getPublicExamQuestions(id, params) {
  const res = await api.get(`/api/public/exams/${id}/questions`, { params });
  return res.data;
}

export async function submitPublicExam(payload) {
  const res = await api.post("/api/public/exams/submit", payload);
  return res.data;
}

// Entrance exam portal (preferred): use examCode + fullName
export async function getPublicEntranceExam(code) {
  const res = await api.get(`/api/public/entrance-exams/${code}`);
  return res.data;
}

export async function getPublicEntranceExamQuestions(code, params) {
  const res = await api.get(`/api/public/entrance-exams/${code}/questions`, { params });
  return res.data;
}

export async function startPublicEntranceExamSession(payload) {
  const res = await api.post("/api/public/entrance-exams/start", payload);
  return res.data;
}

export async function heartbeatPublicEntranceExamSession(payload) {
  const res = await api.post("/api/public/entrance-exams/heartbeat", payload);
  return res.data;
}

export async function submitPublicEntranceExam(payload) {
  const res = await api.post("/api/public/entrance-exams/submit", payload);
  return res.data;
}
