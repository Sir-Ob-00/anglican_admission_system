import api from "./api";

export async function listParents() {
  const res = await api.get("/api/parents");
  return res.data;
}

export async function createParent(payload) {
  const res = await api.post("/api/parents", payload);
  return res.data;
}

export async function updateParent(id, payload) {
  const res = await api.put(`/api/parents/${id}`, payload);
  return res.data;
}

export async function linkParentToStudent(payload) {
  const res = await api.post("/api/parents/link-student", payload);
  return res.data;
}
