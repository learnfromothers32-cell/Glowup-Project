import { Types } from 'mongoose';
import { LiveModeration, ILiveModeration } from '../models/LiveModeration';
import { ModerationAction } from '../types';

export class LiveModerationRepository {
  async findById(id: string): Promise<ILiveModeration | null> {
    return LiveModeration.findById(id);
  }

  async create(data: {
    sessionId: string;
    action: ModerationAction;
    performedBy: string;
    targetUserId?: string;
    targetMessageId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<ILiveModeration> {
    return LiveModeration.create({
      sessionId: new Types.ObjectId(data.sessionId),
      action: data.action,
      performedBy: new Types.ObjectId(data.performedBy),
      targetUserId: data.targetUserId
        ? new Types.ObjectId(data.targetUserId)
        : undefined,
      targetMessageId: data.targetMessageId
        ? new Types.ObjectId(data.targetMessageId)
        : undefined,
      reason: data.reason,
      metadata: data.metadata,
    });
  }

  async findBySession(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ILiveModeration[]> {
    return LiveModeration.find({
      sessionId: new Types.ObjectId(sessionId),
    })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('performedBy', 'name')
      .populate('targetUserId', 'name');
  }

  async findBySessionAndAction(
    sessionId: string,
    action: ModerationAction
  ): Promise<ILiveModeration[]> {
    return LiveModeration.find({
      sessionId: new Types.ObjectId(sessionId),
      action,
    }).sort({ createdAt: -1 });
  }

  async findBySessionAndUser(
    sessionId: string,
    userId: string
  ): Promise<ILiveModeration[]> {
    return LiveModeration.find({
      sessionId: new Types.ObjectId(sessionId),
      targetUserId: new Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
  }

  async isUserBanned(sessionId: string, userId: string): Promise<boolean> {
    const ban = await LiveModeration.findOne({
      sessionId: new Types.ObjectId(sessionId),
      targetUserId: new Types.ObjectId(userId),
      action: 'ban',
    }).sort({ createdAt: -1 });

    if (!ban) return false;

    // Check if there's an unban after the ban
    const unban = await LiveModeration.findOne({
      sessionId: new Types.ObjectId(sessionId),
      targetUserId: new Types.ObjectId(userId),
      action: 'unban',
      createdAt: { $gt: ban.createdAt },
    });

    return !unban;
  }

  async isUserMuted(sessionId: string, userId: string): Promise<boolean> {
    const mute = await LiveModeration.findOne({
      sessionId: new Types.ObjectId(sessionId),
      targetUserId: new Types.ObjectId(userId),
      action: 'mute',
    }).sort({ createdAt: -1 });

    if (!mute) return false;

    // Check if there's an unmute after the mute
    const unmute = await LiveModeration.findOne({
      sessionId: new Types.ObjectId(sessionId),
      targetUserId: new Types.ObjectId(userId),
      action: 'unmute',
      createdAt: { $gt: mute.createdAt },
    });

    return !unmute;
  }

  async getReportCount(sessionId: string): Promise<number> {
    return LiveModeration.countDocuments({
      sessionId: new Types.ObjectId(sessionId),
      action: 'report',
    });
  }

  async hasUserReported(sessionId: string, userId: string): Promise<boolean> {
    const report = await LiveModeration.findOne({
      sessionId: new Types.ObjectId(sessionId),
      performedBy: new Types.ObjectId(userId),
      action: 'report',
    });
    return report !== null;
  }

  async getSessionModerationStats(sessionId: string): Promise<{
    totalActions: number;
    reports: number;
    mutes: number;
    kicks: number;
    bans: number;
  }> {
    const stats = await LiveModeration.aggregate([
      { $match: { sessionId: new Types.ObjectId(sessionId) } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      totalActions: 0,
      reports: 0,
      mutes: 0,
      kicks: 0,
      bans: 0,
    };

    for (const stat of stats) {
      result.totalActions += stat.count;
      switch (stat._id) {
        case 'report':
          result.reports = stat.count;
          break;
        case 'mute':
          result.mutes = stat.count;
          break;
        case 'kick':
          result.kicks = stat.count;
          break;
        case 'ban':
          result.bans = stat.count;
          break;
      }
    }

    return result;
  }
}

export const liveModerationRepository = new LiveModerationRepository();
