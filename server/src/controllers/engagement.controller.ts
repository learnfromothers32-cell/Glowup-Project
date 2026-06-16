import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { UserEngagement } from "../models/UserEngagement";

export const getUserEngagements = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'Authentication required');
    const engagements = await UserEngagement.find({ userId }).lean();
    const likes = engagements.filter((e) => e.type === "like").map((e) => e.transformationId);
    const bookmarks = engagements.filter((e) => e.type === "bookmark").map((e) => e.transformationId);
    return sendSuccess(res, { likes, bookmarks });
  },
);

export const toggleEngagement = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'Authentication required');
    const { transformationId, type, active } = req.body;

    if (active) {
      await UserEngagement.findOneAndUpdate(
        { userId, transformationId, type },
        { $setOnInsert: { userId, transformationId, type } },
        { upsert: true },
      );
    } else {
      await UserEngagement.deleteOne({ userId, transformationId, type });
    }

    return sendSuccess(res, { active });
  },
);
