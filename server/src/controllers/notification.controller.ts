import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { Notification } from "../models/Notification";

export const getMyNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const unreadOnly = req.query.unread === "true";

    const filter: any = { userId };
    if (unreadOnly) filter.read = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  },
);

export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const count = await Notification.countDocuments({ userId, read: false });
    return sendSuccess(res, { count });
  },
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { read: true },
    { new: true },
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return sendSuccess(res, { notification }, "Marked as read");
});

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true },
    );
    return sendSuccess(
      res,
      { modifiedCount: result.modifiedCount },
      "All marked as read",
    );
  },
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid notification ID");
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    return sendSuccess(res, null, "Notification deleted");
  },
);
