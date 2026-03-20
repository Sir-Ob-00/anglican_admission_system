import api from "./api";

export async function listClasses() {
  const res = await api.get("/api/classes");
  return res.data;
}

export async function createClass(payload) {
  const res = await api.post("/api/classes", payload);
  return res.data;
}

export async function updateClass(id, payload) {
  const res = await api.put(`/api/classes/${id}`, payload);
  return res.data;
}
