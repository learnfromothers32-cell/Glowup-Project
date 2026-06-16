import { Router } from "express";
import { getUserEngagements, toggleEngagement } from "../controllers/engagement.controller";
import { protect } from "../middleware/auth.middleware";
import { generalLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", protect, getUserEngagements);
router.post("/toggle", protect, generalLimiter, toggleEngagement);

export default router;
