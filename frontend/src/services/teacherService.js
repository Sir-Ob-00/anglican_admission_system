import api from "./api";

export async function listTeachers() {
  const res = await api.get("/api/teachers");
  return res.data;
}

export async function createTeacher(payload) {
  const res = await api.post("/api/teachers", payload);
  return res.data;
}

export async function updateTeacher(id, payload) {
  const res = await api.put(`/api/teachers/${id}`, payload);
  return res.data;
}

export async function activateTeacher(id) {
  const res = await api.put(`/api/teachers/${id}/activate`);
  return res.data;
}

export async function deactivateTeacher(id) {
  const res = await api.put(`/api/teachers/${id}/deactivate`);
  return res.data;
}

export async function resetTeacherPassword(id, newPassword) {
  const res = await api.post(`/api/teachers/${id}/reset-password`, { newPassword });
  return res.data;
}
