import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import {
  getTrendingTransformations,
  trackTrendingActivity,
  type TrendingTransformation,
  type TrendingCursor,
} from "../services/trending.service";
import { User } from "../models/User";
import { TransformationReport } from "../models/TransformationReport";
import { ApiError } from "../utils/apiError";

export const getTrending = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  let cursor: TrendingCursor | undefined;

  if (req.query.cursorScore && req.query.cursorId) {
    const score = Number(req.query.cursorScore);
    const id = String(req.query.cursorId);
    if (!isNaN(score) && id) {
      cursor = { score, id };
    }
  }

  const result = await getTrendingTransformations(limit, cursor);

  if (req.user?.id) {
    const user = await User.findById(req.user.id).lean();
    const favs: string[] = (user?.favorites || []).map((f: any) => f.toString());
    const itemsWithFollowing = result.items.map((item) => ({
      ...item,
      isFollowing: favs.includes(item.stylistId),
    }));
    return sendSuccess(res, { items: itemsWithFollowing, nextCursor: result.nextCursor });
  }

  return sendSuccess(res, result);
});

export const trackTrending = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { postId, event } = req.body;

    if (event !== "view" && !userId) {
      throw new ApiError(401, "Authentication required to track engagement");
    }

    await trackTrendingActivity(postId, event, userId);
    return sendSuccess(res, null, "Trending activity tracked");
  },
);

export const reportTransformation = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { postId, stylistId, reason } = req.body;

    await TransformationReport.create({
      transformationId: postId,
      stylistId,
      reportedBy: userId,
      reason,
    });

    return sendSuccess(res, null, "Report submitted");
  },
);
