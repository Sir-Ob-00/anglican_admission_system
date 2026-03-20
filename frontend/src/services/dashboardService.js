import api from "./api";

export async function getDashboardSummary() {
  const res = await api.get("/api/dashboard/summary");
  return res.data;
}

export async function getHeadteacherDashboard() {
  const res = await api.get("/api/dashboard/headteacher");
  return res.data;
}

export async function getAssistantDashboard() {
  const res = await api.get("/api/dashboard/assistant");
  return res.data;
}

export async function getTeacherDashboard() {
  const res = await api.get("/api/dashboard/teacher");
  return res.data;
}

export async function getParentDashboard() {
  const res = await api.get("/api/dashboard/parent");
  return res.data;
}
