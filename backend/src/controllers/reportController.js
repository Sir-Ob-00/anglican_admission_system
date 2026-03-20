import { buildReports } from "../services/reportService.js";

export async function getReports(req, res, next) {
  try {
    const data = await buildReports();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

