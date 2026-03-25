import api from "./api";

// ============================================
// HEADTEACHER / ASSISTANT HEADTEACHER ENDPOINTS
// ============================================

export async function listHeadteacherApplicants(params) {
  const res = await api.get("/headteacher/applicants", { params });
  return res.data;
}

export async function listAllHeadteacherApplicants(params) {
  const res = await api.get("/headteacher/parent-applicant/applicants/all", { params });
  return res.data;
}

export async function getHeadteacherApplicantById(id) {
  const res = await api.get(`/headteacher/applicants/${id}`);
  return res.data;
}

export async function createHeadteacherApplicant(payload) {
  const res = await api.post("/headteacher/applicants", payload);
  return res.data;
}

export async function updateHeadteacherApplicant(id, payload) {
  const res = await api.patch(`/headteacher/applicants/${id}`, payload);
  return res.data;
}

export async function deleteHeadteacherApplicant(id) {
  const res = await api.delete(`/headteacher/applicants/${id}`);
  return res.data;
}
