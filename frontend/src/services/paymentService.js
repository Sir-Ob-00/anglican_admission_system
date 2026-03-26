import api from "./api";

// NEW PAYSTACK-BASED PAYMENT FUNCTIONS

export async function initializeAdmissionPayment(applicantId, amount) {
  const payload = { applicantId };
  if (amount !== undefined) payload.amount = amount;
  payload.callback_url = window.location.origin + "/payments/verify";
  const res = await api.post("/headteacher/payments/initiate", payload);
  return res.data;
}

export async function verifyHeadteacherPayment(reference) {
  const res = await api.post("/headteacher/payments/verify", { reference });
  return res.data;
}

export async function getAdmissionPayments() {
  const res = await api.get("/payments/admission");
  return res.data;
}

export async function getPaymentSubmissions() {
  const res = await api.get("/payments/submissions");
  return res.data;
}

export async function verifyPaymentSubmission(submissionId, notes) {
  const res = await api.post("/payments/verify-submission", { submissionId, notes });
  return res.data;
}

// LEGACY PAYMENT FUNCTIONS (KEEP FOR BACKWARDS COMPATIBILITY)

export async function listPayments(params) {
  const res = await api.get("/payments", { params });
  return res.data;
}

export async function initiatePayment(payload) {
  const res = await api.post("/payments/initiate", payload);
  return res.data;
}

export async function verifyPayment(payload) {
  const res = await api.post("/payments/verify", payload);
  return res.data;
}

export async function downloadReceipt(id) {
  const res = await api.get(`/payments/${id}/receipt`, { responseType: "blob" });
  return res.data;
}
