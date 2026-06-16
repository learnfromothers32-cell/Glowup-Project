import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { TransformationComment } from "../models/TransformationComment";
import { trackTrendingActivity } from "../services/trending.service";

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { transformationId } = req.params;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    TransformationComment.find({ transformationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TransformationComment.countDocuments({ transformationId }),
  ]);

  return sendSuccess(res, {
    comments: comments.map((c) => ({
      id: c._id,
      transformationId: c.transformationId,
      userId: c.userId,
      userName: c.userName,
      userAvatar: c.userAvatar,
      text: c.text,
      createdAt: c.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { transformationId, stylistId, text, userName, userAvatar } = req.body;
  const userId = req.user?.id;

  if (!transformationId || !text?.trim()) {
    throw new ApiError(400, "transformationId and text are required");
  }
  if (!stylistId) {
    throw new ApiError(400, "stylistId is required");
  }

  const comment = await TransformationComment.create({
    transformationId,
    stylistId,
    userId,
    userName: userName || "Anonymous",
    userAvatar: userAvatar || "",
    text: text.trim(),
  });

  trackTrendingActivity(transformationId, "comment", userId).catch(() => {});

  return sendSuccess(res, {
    id: comment._id,
    transformationId: comment.transformationId,
    userId: comment.userId,
    userName: comment.userName,
    userAvatar: comment.userAvatar,
    text: comment.text,
    createdAt: comment.createdAt,
  }, "Comment created", 201);
});
