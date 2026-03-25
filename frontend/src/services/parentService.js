import api from "./api";

export async function listParents() {
  const res = await api.get("/parents");
  return res.data;
}

export async function listAllParentApplicantParents() {
  const res = await api.get("/headteacher/parent-applicant/parents/all");
  return res.data;
}

export async function listAllParentApplicantApplicants() {
  const res = await api.get("/headteacher/parent-applicant/applicants/all");
  return res.data;
}

export async function createParent(payload) {
  const res = await api.post("/parents", payload);
  return res.data;
}

export async function updateParent(id, payload) {
  const res = await api.put(`/parents/${id}`, payload);
  return res.data;
}

export async function linkParentToApplicant(payload) {
  const res = await api.post("/headteacher/parent-applicant/link", payload);
  return res.data;
}

export async function getParentForApplicant(applicantId) {
  const res = await api.get(`/headteacher/parent-applicant/applicant/${applicantId}`);
  return res.data;
}

export async function getApplicantsForParent(parentId) {
  const res = await api.get(`/headteacher/parent-applicant/parent/${parentId}`);
  return res.data;
}

export async function updateParentApplicantLink(id, payload) {
  const res = await api.patch(`/headteacher/parent-applicant/${id}`, payload);
  return res.data;
}

export async function deleteParentApplicantLink(id) {
  const res = await api.delete(`/headteacher/parent-applicant/${id}`);
  return res.data;
}
