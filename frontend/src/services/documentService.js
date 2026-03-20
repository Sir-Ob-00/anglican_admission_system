import api from "./api";

export async function listDocuments(params) {
  const res = await api.get("/api/documents", { params });
  return res.data;
}

export async function uploadDocument({ applicantId, documentType, file }) {
  const form = new FormData();
  if (!applicantId && !arguments[0]?.studentId) throw new Error("applicantId or studentId is required");
  if (!documentType) throw new Error("documentType is required");
  if (!file) throw new Error("file is required");
  if (applicantId) form.append("applicantId", applicantId);
  if (arguments[0]?.studentId) form.append("studentId", arguments[0].studentId);
  form.append("documentType", documentType);
  form.append("file", file);
  const res = await api.post("/api/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function verifyDocument(id) {
  const res = await api.put(`/api/documents/${id}/verify`);
  return res.data;
}
