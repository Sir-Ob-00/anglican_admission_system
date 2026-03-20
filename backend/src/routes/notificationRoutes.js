import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { list, markRead } from "../controllers/notificationController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", list);
router.put("/:id/read", markRead);
router.post("/:id/read", markRead);

export default router;

