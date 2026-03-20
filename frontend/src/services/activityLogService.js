import api from "./api";

export async function listActivityLogs(params) {
  const res = await api.get("/api/activity-logs", { params });
  return res.data;
}

