import Notification from "../models/Notification.js";

export async function createNotification({ userId, applicantId, type = "system", message, link }) {
  if (!userId) return null;
  return Notification.create({
    user: userId || undefined,
    applicant: applicantId || undefined,
    type,
    message,
    link: link?.url ? { url: link.url, label: link.label || "Open" } : undefined,
  });
}
