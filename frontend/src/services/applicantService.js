import api from "./api";

export async function listApplicants(params) {
  const res = await api.get("/api/applicants", { params });
  return res.data;
}

export async function getApplicant(id) {
  const res = await api.get(`/api/applicants/${id}`);
  return res.data;
}

export async function createApplicant(payload) {
  const res = await api.post("/api/applicants", payload);
  return res.data;
}

export async function updateApplicant(id, payload) {
  const res = await api.put(`/api/applicants/${id}`, payload);
  return res.data;
}

export async function deleteApplicant(id) {
  const res = await api.delete(`/api/applicants/${id}`);
  return res.data;
}
