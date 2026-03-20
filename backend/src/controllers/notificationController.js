import Notification from "../models/Notification.js";

export async function list(req, res, next) {
  try {
    const { limit = 50, unread } = req.query;
    const filter = {};
    if (req.user?._id) filter.user = req.user._id;
    if (String(unread) === "true") filter.read = false;
    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function markRead(req, res, next) {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: "Notification not found" });
    if (String(n.user || "") !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
    n.read = true;
    await n.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

