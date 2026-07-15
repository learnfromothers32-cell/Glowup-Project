import { Types, FilterQuery } from 'mongoose';
import { LiveParticipant, ILiveParticipant } from '../models/LiveParticipant';
import { ParticipantRole } from '../types';

export class LiveParticipantRepository {
  async findById(id: string): Promise<ILiveParticipant | null> {
    return LiveParticipant.findById(id);
  }

  async findBySessionAndUser(
    sessionId: string,
    userId: string
  ): Promise<ILiveParticipant | null> {
    return LiveParticipant.findOne({
      sessionId: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });
  }

  async findActiveParticipants(sessionId: string): Promise<ILiveParticipant[]> {
    return LiveParticipant.find({
      sessionId: new Types.ObjectId(sessionId),
      leftAt: null,
    }).sort({ joinedAt: -1 });
  }

  async findActiveParticipantsBySession(sessionId: string): Promise<ILiveParticipant[]> {
    return LiveParticipant.find({
      sessionId: new Types.ObjectId(sessionId),
      leftAt: null,
    }).populate('userId', 'name avatar');
  }

  async findBannedUsers(sessionId: string): Promise<string[]> {
    const banned = await LiveParticipant.find({
      sessionId: new Types.ObjectId(sessionId),
      isBanned: true,
    }).select('userId');
    return banned.map((p) => p.userId.toString());
  }

  async findMutedUsers(sessionId: string): Promise<string[]> {
    const muted = await LiveParticipant.find({
      sessionId: new Types.ObjectId(sessionId),
      isMuted: true,
      leftAt: null,
    }).select('userId');
    return muted.map((p) => p.userId.toString());
  }

  async addParticipant(
    sessionId: string,
    userId: string,
    role: ParticipantRole = 'viewer'
  ): Promise<ILiveParticipant> {
    return LiveParticipant.create({
      sessionId: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      role,
      joinedAt: new Date(),
    });
  }

  async removeParticipant(sessionId: string, userId: string): Promise<ILiveParticipant | null> {
    return LiveParticipant.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        leftAt: null,
      },
      { $set: { leftAt: new Date() } },
      { new: true }
    );
  }

  async updateWatchDuration(
    sessionId: string,
    userId: string,
    durationMs: number
  ): Promise<ILiveParticipant | null> {
    return LiveParticipant.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      },
      { $inc: { watchDurationMs: durationMs } },
      { new: true }
    );
  }

  async setMuted(
    sessionId: string,
    userId: string,
    isMuted: boolean
  ): Promise<ILiveParticipant | null> {
    return LiveParticipant.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { isMuted } },
      { new: true }
    );
  }

  async setBanned(
    sessionId: string,
    userId: string,
    isBanned: boolean
  ): Promise<ILiveParticipant | null> {
    return LiveParticipant.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { isBanned } },
      { new: true }
    );
  }

  async countActiveParticipants(sessionId: string): Promise<number> {
    return LiveParticipant.countDocuments({
      sessionId: new Types.ObjectId(sessionId),
      leftAt: null,
    });
  }

  async isUserInSession(sessionId: string, userId: string): Promise<boolean> {
    const participant = await LiveParticipant.findOne({
      sessionId: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      leftAt: null,
    });
    return participant !== null;
  }

  async isUserBanned(sessionId: string, userId: string): Promise<boolean> {
    const participant = await LiveParticipant.findOne({
      sessionId: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      isBanned: true,
    });
    return participant !== null;
  }

  async removeModerator(sessionId: string, userId: string): Promise<ILiveParticipant | null> {
    return LiveParticipant.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        role: 'moderator',
      },
      { $set: { role: 'viewer' } },
      { new: true }
    );
  }

  async addModerator(sessionId: string, userId: string): Promise<ILiveParticipant | null> {
    return LiveParticipant.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { role: 'moderator' } },
      { new: true }
    );
  }

  async getSessionStats(sessionId: string): Promise<{
    totalParticipants: number;
    activeParticipants: number;
    totalWatchTimeMs: number;
  }> {
    const stats = await LiveParticipant.aggregate([
      { $match: { sessionId: new Types.ObjectId(sessionId) } },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          activeParticipants: {
            $sum: { $cond: [{ $eq: ['$leftAt', null] }, 1, 0] },
          },
          totalWatchTimeMs: { $sum: '$watchDurationMs' },
        },
      },
    ]);

    return stats[0] || { totalParticipants: 0, activeParticipants: 0, totalWatchTimeMs: 0 };
  }
}

export const liveParticipantRepository = new LiveParticipantRepository();
