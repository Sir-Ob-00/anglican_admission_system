import api from "./api";

export async function listNotifications(params) {
  const res = await api.get("/api/notifications", { params });
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await api.post(`/api/notifications/${id}/read`);
  return res.data;
}
