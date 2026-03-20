import ActivityLog from "../models/ActivityLog.js";

export async function list(req, res, next) {
  try {
    const limit = Number(req.query.limit || 100);
    const filter = {};
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.action) filter.action = new RegExp(String(req.query.action), "i");
    const items = await ActivityLog.find(filter)
      .populate("user", "name username role")
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}
