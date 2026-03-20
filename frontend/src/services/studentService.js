import api from "./api";

export async function listStudents() {
  const res = await api.get("/api/students");
  return res.data;
}

