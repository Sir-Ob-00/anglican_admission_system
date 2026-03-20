import api from "./api";

export async function login({ username, password }) {
  const res = await api.post("/api/auth/login", { username, password });
  return res.data;
}

export async function me() {
  const res = await api.get("/api/auth/me");
  return res.data;
}
