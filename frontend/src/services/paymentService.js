import api from "./api";

// NEW PAYSTACK-BASED PAYMENT FUNCTIONS

export async function initializeAdmissionPayment(applicantId) {
  const res = await api.post("/api/payments/initialize", { applicantId });
  return res.data;
}

export async function getAdmissionPayments() {
  const res = await api.get("/api/payments/admission");
  return res.data;
}

export async function getPaymentSubmissions() {
  const res = await api.get("/api/payments/submissions");
  return res.data;
}

export async function verifyPaymentSubmission(submissionId, notes) {
  const res = await api.post("/api/payments/verify-submission", { submissionId, notes });
  return res.data;
}

// LEGACY PAYMENT FUNCTIONS (KEEP FOR BACKWARDS COMPATIBILITY)

export async function listPayments(params) {
  const res = await api.get("/api/payments", { params });
  return res.data;
}

export async function initiatePayment(payload) {
  const res = await api.post("/api/payments/initiate", payload);
  return res.data;
}

export async function verifyPayment(payload) {
  const res = await api.post("/api/payments/verify", payload);
  return res.data;
}

export async function downloadReceipt(id) {
  const res = await api.get(`/api/payments/${id}/receipt`, { responseType: "blob" });
  return res.data;
}
