/**
 * Live Reaction Handlers
 *
 * Handles sending reactions with rate limiting and aggregated counts.
 * Broadcasts to room with automatic cleanup.
 * Optimized for mobile performance — lightweight payloads.
 */

import { Socket } from 'socket.io';
import { reactionSendSchema } from '../validators';
import { liveAnalyticsService } from '../services/LiveAnalyticsService';
import { LIVE_ERROR_CODES } from './types';
import { broadcastToRoom } from './responses';
import logger from '../../utils/logger';

const VALID_REACTIONS = ['love', 'fire', 'clap', 'wow', 'glow'] as const;
const REACTION_RATE_LIMIT_MS = 500; // 1 reaction per 500ms per user

export interface ReactionHandlerDeps {
  rateLimiter: any;
}

export function registerReactionHandlers(
  socket: Socket,
  deps: ReactionHandlerDeps
) {
  const userId = (socket as any).user?.id;
  const lastReactionTime: Map<string, number> = new Map();

  // ── live:reaction:send ──
  socket.on('live:reaction:send', async (data: any) => {
    try {
      const parsed = reactionSendSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, type } = parsed.data;

      // Validate reaction type
      if (!VALID_REACTIONS.includes(type as any)) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid reaction type' });
        return;
      }

      // Rate limit per user
      const now = Date.now();
      const lastTime = lastReactionTime.get(userId) || 0;
      if (now - lastTime < REACTION_RATE_LIMIT_MS) {
        // Silently drop — don't spam errors for reactions
        return;
      }
      lastReactionTime.set(userId, now);

      // Record analytics
      liveAnalyticsService.recordReaction(sessionId, type);

      // Get aggregated counts
      const counts = liveAnalyticsService.getReactionCounts(sessionId);

      // Broadcast to room (including sender for animation)
      socket.to(`live:${sessionId}`).emit('live:reaction:received', {
        sessionId,
        type,
        userId,
        counts,
      });

      // Emit to sender too (for animation feedback)
      socket.emit('live:reaction:received', {
        sessionId,
        type,
        userId,
        counts,
      });
    } catch (error) {
      logger.error('Error sending reaction', { error: (error as Error).message });
    }
  });
}
