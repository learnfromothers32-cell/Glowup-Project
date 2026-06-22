import { Router } from "express";
import { getComments, createComment, toggleCommentLike } from "../controllers/comment.controller";
import { protect } from "../middleware/auth.middleware";
import { generalLimiter } from "../middleware/rateLimiter";
import { validate, createCommentSchema } from "../middleware/validate";

const router = Router();

router.get("/:transformationId", getComments);
router.post("/", protect, generalLimiter, validate(createCommentSchema), createComment);
router.post("/:commentId/like", protect, toggleCommentLike);

export default router;
