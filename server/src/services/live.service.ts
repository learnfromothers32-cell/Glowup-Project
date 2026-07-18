import { AccessToken } from 'livekit-server-sdk';
import { appConfig } from '../config/app';
import { LiveSession, ILiveSession } from '../models/LiveSession';
import { Stylist } from '../models/Stylist';
import logger from '../utils/logger';

const STALE_SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours

function generateRoomId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `live_${ts}_${rand}`;
}

export async function cleanupStaleSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_SESSION_TIMEOUT_MS);
  const result = await LiveSession.updateMany(
    { status: 'live', startedAt: { $lt: cutoff } },
    {
      $set: {
        status: 'ended',
        endedAt: new Date(),
        viewerCount: 0,
      },
    }
  );
  if (result.modifiedCount > 0) {
    logger.warn(`Cleaned up ${result.modifiedCount} stale live sessions`);
  }
  return result.modifiedCount;
}

export async function createSession(
  stylistUserId: string,
  title: string,
  category: string,
  thumbnail?: string
): Promise<{ session: ILiveSession; token: string }> {
  const stylist = await Stylist.findOne({ userId: stylistUserId });
  if (!stylist) throw new Error('Stylist profile not found');

  const activeSession = await LiveSession.findOne({
    stylistId: stylist._id,
    status: { $in: ['pending', 'live'] },
  });
  if (activeSession) throw new Error('You already have an active live session');

  const roomId = generateRoomId();

  const session = await LiveSession.create({
    stylistId: stylist._id,
    title,
    category,
    thumbnail,
    status: 'pending',
    roomId,
  });

  const at = new AccessToken(appConfig.livekit.apiKey, appConfig.livekit.apiSecret, {
    identity: `stylist_${stylistUserId}`,
  });
  at.addGrant({
    roomJoin: true,
    roomCreate: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    room: roomId,
  });
  const token = await at.toJwt();

  return { session, token };
}

export async function startSession(sessionId: string, stylistUserId: string): Promise<ILiveSession> {
  const session = await LiveSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  const stylist = await Stylist.findOne({ userId: stylistUserId });
  if (!stylist || !session.stylistId.equals(stylist._id)) {
    throw new Error('Not authorized');
  }

  // Clean up any other pending sessions for this stylist
  await LiveSession.updateMany(
    { stylistId: stylist._id, status: 'pending', _id: { $ne: session._id } },
    { $set: { status: 'ended' } }
  );

  session.status = 'live';
  session.startedAt = new Date();
  await session.save();

  return session;
}

export async function endSession(sessionId: string, stylistUserId: string): Promise<ILiveSession> {
  const session = await LiveSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  const stylist = await Stylist.findOne({ userId: stylistUserId });
  if (!stylist || !session.stylistId.equals(stylist._id)) {
    throw new Error('Not authorized');
  }

  session.status = 'ended';
  session.endedAt = new Date();
  if (session.startedAt) {
    session.duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
  }
  await session.save();

  return session;
}

export async function getActiveSessions() {
  const sessions = await LiveSession.find({ status: 'live' })
    .populate('stylistId', 'name image category followerCount')
    .sort({ startedAt: -1 })
    .lean();
  return sessions as any[];
}

export async function getSessionById(sessionId: string) {
  const session = await LiveSession.findById(sessionId)
    .populate('stylistId', 'name image category followerCount')
    .lean();
  return session as any;
}

export async function joinSession(sessionId: string, userId: string): Promise<{ token: string; session: ILiveSession }> {
  const session = await LiveSession.findById(sessionId);
  if (!session || session.status !== 'live') {
    throw new Error('Session not found or no longer live');
  }

  const lk = new AccessToken(appConfig.livekit.apiKey, appConfig.livekit.apiSecret, {
    identity: `viewer_${userId}`,
  });
  lk.addGrant({
    roomJoin: true,
    canPublish: false,
    canSubscribe: true,
    canPublishData: true,
    room: session.roomId,
  });
  const token = await lk.toJwt();

  return { token, session: session as any };
}

export async function incrementViewerCount(sessionId: string): Promise<number> {
  const session = await LiveSession.findByIdAndUpdate(
    sessionId,
    {
      $inc: { viewerCount: 1 },
      $max: { peakViewerCount: { $add: ['$viewerCount', 1] } },
    },
    { new: true }
  );
  return session?.viewerCount ?? 0;
}

export async function decrementViewerCount(sessionId: string): Promise<number> {
  const session = await LiveSession.findByIdAndUpdate(
    sessionId,
    [{ $set: { viewerCount: { $max: [{ $subtract: ['$viewerCount', 1] }, 0] } } }],
    { new: true }
  );
  return session?.viewerCount ?? 0;
}

export async function handleWebhook(body: any): Promise<void> {
  const events = body?.events || [];
  if (!Array.isArray(events)) {
    logger.warn('Invalid webhook payload: events is not an array');
    return;
  }

  for (const event of events) {
    const { event: eventType, room } = event;
    if (!room?.name) {
      logger.warn('Webhook event missing room name', { eventType });
      continue;
    }

    if (eventType === 'room_ended' || eventType === 'room_closed') {
      try {
        const session = await LiveSession.findOne({ roomId: room.name, status: 'live' });
        if (session) {
          session.status = 'ended';
          session.endedAt = new Date();
          if (session.startedAt) {
            session.duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
          }
          session.viewerCount = 0;
          await session.save();
          logger.info(`Live session ${session._id} ended via webhook`);
        }
      } catch (err) {
        logger.error('Failed to process webhook event', { error: err, room: room.name });
      }
    }
  }
}
