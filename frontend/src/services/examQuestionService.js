import api from "./api";

export async function listExamQuestions(params) {
  const res = await api.get("/api/exam-questions", { params });
  return res.data;
}

export async function createExamQuestion(payload) {
  const res = await api.post("/api/exam-questions", payload);
  return res.data;
}

export async function updateExamQuestion(id, payload) {
  const res = await api.put(`/api/exam-questions/${id}`, payload);
  return res.data;
}

export async function deleteExamQuestion(id) {
  const res = await api.delete(`/api/exam-questions/${id}`);
  return res.data;
}
