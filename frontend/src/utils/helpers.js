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

export function statusLabel(status) {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function statusTone(status) {
  switch (status) {
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
  switch (role) {
    case "admin":
      return "/admin";
    case "headteacher":
      return "/headteacher";
    case "assistantHeadteacher":
      return "/assistant-headteacher";
    case "teacher":
      return "/teacher";
    default:
      return "/parent";
  }
}
