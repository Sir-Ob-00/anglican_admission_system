import api from "./api";

export async function getReports() {
  const res = await api.get("/api/reports");
  return res.data;
}

