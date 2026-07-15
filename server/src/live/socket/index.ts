/**
 * Live Socket Namespace
 *
 * Sets up the /live Socket.IO namespace with:
 * - JWT authentication
 * - Redis-backed presence
 * - Redis-backed viewer count
 * - Rate limiting
 * - Heartbeat management
 *
 * This module does NOT import LiveKit. It communicates only through
 * LiveSessionService which uses the LiveMediaProvider abstraction.
 */

import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { verifyAccessToken } from '../../utils/token';
import { appConfig } from '../../config/app';
import { LivePresence } from './presence';
import { LiveViewerCount } from './viewerCount';
import { LiveRateLimiter } from './rateLimit';
import { registerLiveHandlers } from './handlers';
import { registerSocketEvents } from './pipeline';
import { createChatEventConfigs } from './chatHandlers';
import { registerModerationHandlers } from './moderationHandlers';
import { registerReactionHandlers } from './reactionHandlers';
import { registerGuestRequestHandlers } from './guestRequestHandlers';
import { LiveSessionService } from '../services/LiveSessionService';
import { LiveChatService } from '../services/LiveChatService';
import { getMediaProvider } from '../providers/factory';
import { RedisChatBroadcaster } from './broadcast/RedisChatBroadcaster';
import { ChatBroadcaster, BroadcastMessage } from './broadcast/types';
import logger from '../../utils/logger';

let livePresence: LivePresence | null = null;
let liveViewerCount: LiveViewerCount | null = null;
let liveRateLimiter: LiveRateLimiter | null = null;
let sessionService: LiveSessionService | null = null;
let chatService: LiveChatService | null = null;
let chatBroadcaster: ChatBroadcaster | null = null;
let liveNsp: ReturnType<Server['of']> | null = null;

// Track active broadcast subscriptions per session
const broadcastSubscriptions = new Map<string, number>(); // sessionId → subscriber count

/**
 * Initialize the /live namespace on the given Socket.IO server.
 *
 * @param io - The Socket.IO server instance
 * @param redisUrl - Redis URL for presence/viewer count (from ioredis adapter)
 */
export function initLiveNamespace(io: Server, redisUrl?: string): void {
  if (!redisUrl) {
    logger.warn('Live namespace requires Redis. Skipping initialization.');
    return;
  }

  // Create shared services
  livePresence = new LivePresence(redisUrl);
  liveViewerCount = new LiveViewerCount(redisUrl);
  liveRateLimiter = new LiveRateLimiter(redisUrl);
  sessionService = new LiveSessionService(getMediaProvider());

  // Create chat broadcaster and service
  chatBroadcaster = new RedisChatBroadcaster(redisUrl);
  chatService = new LiveChatService({ broadcaster: chatBroadcaster });

  // Connect Redis clients
  livePresence.connect().catch(() => {});
  liveViewerCount.connect().catch(() => {});
  liveRateLimiter.connect().catch(() => {});
  chatBroadcaster.connect().catch(() => {});

  const liveNsp = io.of('/live');

  // ── Authentication middleware ──
  liveNsp.use(async (socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ──
  liveNsp.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id;
    const userRole = (socket as any).user?.role;

    logger.info('Live socket connected', {
      socketId: socket.id,
      userId,
      role: userRole,
    });

    // Register all event handlers
    registerLiveHandlers(socket, {
      presence: livePresence!,
      viewerCount: liveViewerCount!,
      rateLimiter: liveRateLimiter!,
      sessionService: sessionService!,
      onJoinRoom: ensureBroadcastSubscription,
      onLeaveRoom: removeBroadcastSubscription,
    });

    // Register chat event handlers using the middleware pipeline
    const chatEvents = createChatEventConfigs({
      chatService: chatService!,
      rateLimiter: liveRateLimiter!,
    });
    registerSocketEvents(socket, chatEvents);

    // Register moderation, reaction, and guest request handlers
    registerModerationHandlers(socket, { rateLimiter: liveRateLimiter! });
    registerReactionHandlers(socket, { rateLimiter: liveRateLimiter! });
    registerGuestRequestHandlers(socket, { rateLimiter: liveRateLimiter! });

    // Connection rate limit check
    liveRateLimiter!
      .isAllowed(`connect:${userId}`, 'live:connect')
      .then((allowed) => {
        if (!allowed) {
          socket.emit('live:error', {
            code: 'RATE_LIMITED',
            message: 'Too many connections',
          });
          socket.disconnect(true);
        }
      })
      .catch(() => {});
  });

  logger.info('Live namespace initialized at /live');
}

/**
 * Ensure we're subscribed to the broadcast channel for a session.
 * When the first socket joins, subscribe. When messages arrive,
 * forward them to the Socket.IO room.
 */
export function ensureBroadcastSubscription(sessionId: string): void {
  if (!chatBroadcaster || !liveNsp) return;

  const count = broadcastSubscriptions.get(sessionId) || 0;
  broadcastSubscriptions.set(sessionId, count + 1);

  // Already subscribed
  if (count > 0) return;

  chatBroadcaster.subscribe(sessionId, (msg: BroadcastMessage) => {
    if (!liveNsp) return;
    // Forward to all sockets in the Socket.IO room
    liveNsp.to(`live:${sessionId}`).emit(msg.event as any, msg.data);
  }).catch(() => {});
}

/**
 * Remove broadcast subscription for a session.
 * When the last socket leaves, unsubscribe from Redis.
 */
export function removeBroadcastSubscription(sessionId: string): void {
  if (!chatBroadcaster) return;

  const count = broadcastSubscriptions.get(sessionId) || 0;
  if (count <= 1) {
    broadcastSubscriptions.delete(sessionId);
    chatBroadcaster.unsubscribe(sessionId).catch(() => {});
  } else {
    broadcastSubscriptions.set(sessionId, count - 1);
  }
}

/**
 * Get the presence instance (for external use, e.g., REST endpoints).
 */
export function getLivePresence(): LivePresence | null {
  return livePresence;
}

/**
 * Get the viewer count instance (for external use).
 */
export function getLiveViewerCount(): LiveViewerCount | null {
  return liveViewerCount;
}
