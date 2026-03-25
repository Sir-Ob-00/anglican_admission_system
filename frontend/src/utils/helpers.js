export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export const ADMISSION_STATUSES = [
  "pending_review",
  "exam_scheduled",
  "exam_completed",
  "exam_passed",
  "exam_failed",
  "awaiting_payment",
  "payment_completed",
  "admitted",
  "rejected",
];

export function normalizeWorkflowStatus(status) {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw) return "";

  const normalized = raw.replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "pending":
    case "pendingreview":
    case "pending_review":
      return "pending_review";
    case "exam_scheduled":
    case "exams_scheduled":
    case "scheduled_for_exam":
      return "exam_scheduled";
    case "exam_completed":
    case "exams_completed":
      return "exam_completed";
    case "exam_passed":
    case "exams_passed":
    case "passed":
      return "exam_passed";
    case "exam_failed":
    case "exams_failed":
    case "failed":
      return "exam_failed";
    case "awaiting_payment":
    case "payment_pending":
      return "awaiting_payment";
    case "payment_completed":
    case "paid":
    case "verified":
      return "payment_completed";
    case "admitted":
      return "admitted";
    case "rejected":
      return "rejected";
    default:
      return normalized;
  }
}

export function statusLabel(status) {
  const normalized = normalizeWorkflowStatus(status) || String(status || "").toLowerCase();
  if (!normalized) return "Unknown";
  return normalized
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function statusTone(status) {
  switch (normalizeWorkflowStatus(status)) {
    case "admitted":
    case "payment_completed":
    case "exam_passed":
      return "success";
    case "rejected":
    case "exam_failed":
      return "danger";
    case "awaiting_payment":
    case "exam_scheduled":
      return "warning";
    default:
      return "neutral";
  }
}

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function roleHomePath(role) {
  // Convert role to lowercase for consistent matching
  const normalizedRole = role?.toLowerCase();
  
  switch (normalizedRole) {
    case "admin":
      return "/admin";
    case "headteacher":
      return "/headteacher";
    case "assistant_headteacher":
      return "/assistant-headteacher";
    case "teacher":
      return "/teacher";
    case "parent":
      return "/parent";
    default:
      return "/parent";
  }
}
