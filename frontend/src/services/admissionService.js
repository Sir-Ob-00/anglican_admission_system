import api from "./api";

export async function listAdmissions() {
  const res = await api.get("/api/admissions");
  return res.data;
}

export async function getAdmission(id) {
  const res = await api.get(`/api/admissions/${id}`);
  return res.data;
}

export async function approveAdmission(applicantId) {
  const payload =
    typeof arguments[1] === "object" && arguments[1] != null
      ? { applicantId, ...arguments[1] }
      : { applicantId };
  const res = await api.post("/api/admissions/approve", payload);
  return res.data;
}

export async function rejectAdmission(applicantId) {
  const res = await api.post("/api/admissions/reject", { applicantId });
  return res.data;
}

export async function downloadAdmissionConfirmation(applicantId) {
  const res = await api.get(`/api/admissions/applicant/${applicantId}/confirmation`, {
    responseType: "blob",
  });
  return res.data;
}
