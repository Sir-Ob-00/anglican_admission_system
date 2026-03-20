import api from "./api";

export async function listUsers(params) {
  const res = await api.get("/api/users", { params });
  return res.data;
}

export async function createUser(payload) {
  const res = await api.post("/api/users", payload);
  return res.data;
}

export async function updateUser(id, payload) {
  const res = await api.put(`/api/users/${id}`, payload);
  return res.data;
}

export async function deactivateUser(id) {
  const res = await api.delete(`/api/users/${id}`);
  return res.data;
}

