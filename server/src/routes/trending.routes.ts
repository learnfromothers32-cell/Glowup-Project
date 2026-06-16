import { Router } from "express";
import { getTrending, trackTrending, reportTransformation } from "../controllers/trending.controller";
import { softAuth, protect } from "../middleware/auth.middleware";
import { generalLimiter } from "../middleware/rateLimiter";
import { validate, trendingTrackSchema, trendingReportSchema } from "../middleware/validate";

const router = Router();

router.get("/", softAuth, getTrending);
router.post("/track", softAuth, generalLimiter, validate(trendingTrackSchema), trackTrending);
router.post("/report", protect, validate(trendingReportSchema), reportTransformation);

export default router;
