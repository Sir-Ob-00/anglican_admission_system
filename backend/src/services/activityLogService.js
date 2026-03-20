import ActivityLog from "../models/ActivityLog.js";

export async function logActivity({ userId, action, ipAddress, meta }) {
  return ActivityLog.create({
    user: userId || undefined,
    action,
    ipAddress,
    meta: meta || {},
  });
}

