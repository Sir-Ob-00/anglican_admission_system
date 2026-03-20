import api from "./api";

export async function createBackup() {
  const res = await api.post("/api/backups/create");
  return res.data;
}

export async function listBackups() {
  const res = await api.get("/api/backups");
  return res.data;
}

export function backupDownloadUrl(id) {
  const base = api.defaults.baseURL || "";
  return `${base}/api/backups/${id}/download`;
}

export async function restoreBackup(id, confirm = false) {
  const res = await api.post(`/api/backups/${id}/restore`, { confirm });
  return res.data;
}
