/**
 * Live Socket Event Handlers
 *
 * Handles all /live namespace events.
 * No LiveKit imports — only LiveSessionService and Redis modules.
 */

import { Socket } from 'socket.io';
import { LivePresence } from './presence';
import { LiveViewerCount } from './viewerCount';
import { LiveRateLimiter } from './rateLimit';
import {
  PresenceEntry,
  SocketRole,
  JoinRoomInput,
  LeaveRoomInput,
  HeartbeatInput,
  PinServiceInput,
  UnpinServiceInput,
  AvailabilityUpdateInput,
  ShelfToggleInput,
  LIVE_ERROR_CODES,
  joinRoomSchema,
  leaveRoomSchema,
  heartbeatSchema,
  pinServiceSchema,
  unpinServiceSchema,
  availabilitySchema,
  shelfToggleSchema,
} from './types';
import { LiveSessionService } from '../services/LiveSessionService';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { liveModerationRepository } from '../repositories/LiveModerationRepository';
import { ChatBroadcaster } from './broadcast/types';
import logger from '../../utils/logger';

// ── Stale Connection Strategy ──
// Redis TTL is the authoritative cleanup mechanism:
//   - live:presence:{sessionId} hash TTL: 300s (5 minutes)
//   - live:heartbeat:{sessionId}:{userId} TTL: 120s (2 minutes)
// When a socket disconnects, the 'disconnect' handler cleans up immediately.
// When a socket hangs without heartbeats, the Redis TTL expires the key.
// No active cleanup worker is needed — Redis handles it.

export interface LiveHandlerDeps {
  presence: LivePresence;
  viewerCount: LiveViewerCount;
  rateLimiter: LiveRateLimiter;
  sessionService: LiveSessionService;
  onJoinRoom?: (sessionId: string) => void;
  onLeaveRoom?: (sessionId: string) => void;
}

/**
 * Set up all /live namespace event handlers on a connected socket.
 */
export function registerLiveHandlers(
  socket: Socket,
  deps: LiveHandlerDeps
): void {
  const userId = (socket as any).user?.id as string | undefined;
  const userRole = (socket as any).user?.role as string | undefined;

  if (!userId) {
    socket.emit('live:error', {
      code: LIVE_ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    });
    socket.disconnect(true);
    return;
  }

  // ── live:join ──
  socket.on('live:join', async (data: JoinRoomInput) => {
    try {
      // Validate payload
      const parsed = joinRoomSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.INVALID_PAYLOAD,
          message: 'Invalid join payload',
        });
        return;
      }

      const { sessionId, role, displayName } = parsed.data;

      // Rate limit
      const allowed = await deps.rateLimiter.isAllowed(
        `join:${userId}:${sessionId}`,
        'live:join'
      );
      if (!allowed) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.RATE_LIMITED,
          message: 'Too many join requests. Slow down.',
        });
        return;
      }

      // Check for duplicate join
      const alreadyIn = await deps.presence.isUserInRoom(sessionId, userId);
      if (alreadyIn) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.DUPLICATE_JOIN,
          message: 'Already in this room',
        });
        return;
      }

      // Verify session exists and is joinable
      const session = await liveSessionRepository.findById(sessionId);
      if (!session) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Session not found',
        });
        return;
      }

      if (!['live', 'paused'].includes(session.status)) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.ROOM_CLOSED,
          message: 'Session is not live',
        });
        return;
      }

      // Check if user is banned from this session
      const isBanned = await liveModerationRepository.isUserBanned(sessionId, userId);
      if (isBanned) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.PERMISSION_DENIED,
          message: 'You are banned from this session',
        });
        return;
      }

      // Verify role authorization
      if (role === 'host' && session.hostUserId.toString() !== userId) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.PERMISSION_DENIED,
          message: 'Only the host can join as host',
        });
        return;
      }

      // Add to presence
      const entry = await deps.presence.addPresence(
        sessionId,
        socket.id,
        userId,
        role,
        displayName || `User ${userId.slice(-4)}`
      );

      // Join Socket.IO room
      socket.join(`live:${sessionId}`);

      // Increment viewer count (hosts are not counted as viewers)
      let viewerCount = await deps.viewerCount.getCount(sessionId);
      if (role !== 'host') {
        viewerCount = await deps.viewerCount.increment(sessionId);
      } else {
        viewerCount = await deps.viewerCount.getCount(sessionId);
      }

      // Get full presence list
      const presence = await deps.presence.getPresence(sessionId);

      // Send confirmation to the joining user
      socket.emit('live:joined', {
        sessionId,
        presence,
        viewerCount,
      });

      // Broadcast presence update to others
      socket.to(`live:${sessionId}`).emit('live:presence', {
        sessionId,
        action: 'join',
        user: entry,
      });

      // Broadcast viewer count
      socket.to(`live:${sessionId}`).emit('live:viewer-count', {
        sessionId,
        count: viewerCount,
      });

      // If host joined, notify everyone
      if (role === 'host') {
        socket.to(`live:${sessionId}`).emit('live:host-online', { sessionId });
      }

      // Subscribe to broadcast channel for cross-instance delivery
      deps.onJoinRoom?.(sessionId);

      logger.info('User joined live room', {
        sessionId,
        userId,
        role,
        viewerCount,
      });
    } catch (error) {
      logger.error('Error handling live:join', {
        error: (error as Error).message,
        sessionId: data?.sessionId,
        userId,
      });
      socket.emit('live:error', {
        code: LIVE_ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to join room',
      });
    }
  });

  // ── live:leave ──
  socket.on('live:leave', async (data: LeaveRoomInput) => {
    try {
      const parsed = leaveRoomSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', {
          code: LIVE_ERROR_CODES.INVALID_PAYLOAD,
          message: 'Invalid leave payload',
        });
        return;
      }

      const { sessionId } = parsed.data;

      // Rate limit
      await deps.rateLimiter.isAllowed(`leave:${userId}:${sessionId}`, 'live:leave');

      // Remove from presence
      const entry = await deps.presence.removePresence(sessionId, socket.id);

      // Leave Socket.IO room
      socket.leave(`live:${sessionId}`);

      if (entry) {
        // Decrement viewer count (hosts are not counted)
        let viewerCount = await deps.viewerCount.getCount(sessionId);
        if (entry.role !== 'host') {
          viewerCount = await deps.viewerCount.decrement(sessionId);
        }

        // Broadcast presence update
        socket.to(`live:${sessionId}`).emit('live:presence', {
          sessionId,
          action: 'leave',
          user: entry,
        });

        // Broadcast viewer count
        socket.to(`live:${sessionId}`).emit('live:viewer-count', {
          sessionId,
          count: viewerCount,
        });

        // If host left, notify everyone
        if (entry.role === 'host') {
          socket.to(`live:${sessionId}`).emit('live:host-offline', { sessionId });
        }

        logger.info('User left live room', {
          sessionId,
          userId,
          role: entry.role,
          viewerCount,
        });
      }

      socket.emit('live:left', { sessionId });

      // Unsubscribe from broadcast channel
      deps.onLeaveRoom?.(sessionId);
    } catch (error) {
      logger.error('Error handling live:leave', {
        error: (error as Error).message,
        sessionId: data?.sessionId,
        userId,
      });
    }
  });

  // ── live:heartbeat ──
  socket.on('live:heartbeat', async (data: HeartbeatInput) => {
    try {
      const parsed = heartbeatSchema.safeParse(data);
      if (!parsed.success) return;

      const { sessionId } = parsed.data;

      // Rate limit
      const allowed = await deps.rateLimiter.isAllowed(
        `heartbeat:${userId}:${sessionId}`,
        'live:heartbeat'
      );
      if (!allowed) return;

      // Update heartbeat in Redis
      await deps.presence.updateHeartbeat(sessionId, userId);

      // Respond with pong
      socket.emit('live:pong', {
        sessionId,
        timestamp: Date.now(),
      });
    } catch {
      // Silently ignore heartbeat errors
    }
  });

  // ── Socket disconnect ──
  // ── live:service:pin ──
  socket.on('live:service:pin', async (data: PinServiceInput) => {
    try {
      const parsed = pinServiceSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, serviceId } = parsed.data;

      // Rate limit
      const allowed = await deps.rateLimiter.isAllowed(
        `commerce:${userId}:${sessionId}`,
        'live:service:pin'
      );
      if (!allowed) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.RATE_LIMITED, message: 'Too many requests' });
        return;
      }

      // Only host can pin services
      const session = await liveSessionRepository.findById(sessionId);
      if (!session || session.hostUserId.toString() !== userId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only the host can pin services' });
        return;
      }

      // Fetch service details
      const { Service } = await import('../../models/Service');
      const service = await Service.findById(serviceId).lean();
      if (!service) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Service not found' });
        return;
      }

      // Broadcast to all in room
      socket.to(`live:${sessionId}`).emit('live:service:pinned', {
        sessionId,
        serviceId,
        service: {
          serviceId: service._id.toString(),
          name: service.name,
          price: service.price,
          duration: service.duration,
          category: service.category,
        },
      });
      // Also emit to sender
      socket.emit('live:service:pinned', {
        sessionId,
        serviceId,
        service: {
          serviceId: service._id.toString(),
          name: service.name,
          price: service.price,
          duration: service.duration,
          category: service.category,
        },
      });

      logger.info('Service pinned in live room', { sessionId, serviceId, userId });
    } catch (error) {
      logger.error('Error pinning service', { error: (error as Error).message });
    }
  });

  // ── live:service:unpin ──
  socket.on('live:service:unpin', async (data: UnpinServiceInput) => {
    try {
      const parsed = unpinServiceSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId } = parsed.data;

      // Rate limit
      const allowed = await deps.rateLimiter.isAllowed(
        `commerce:${userId}:${sessionId}`,
        'live:service:unpin'
      );
      if (!allowed) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.RATE_LIMITED, message: 'Too many requests' });
        return;
      }

      const session = await liveSessionRepository.findById(sessionId);
      if (!session || session.hostUserId.toString() !== userId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only the host can unpin services' });
        return;
      }

      socket.to(`live:${sessionId}`).emit('live:service:unpinned', { sessionId });
      socket.emit('live:service:unpinned', { sessionId });

      logger.info('Service unpinned in live room', { sessionId, userId });
    } catch (error) {
      logger.error('Error unpinning service', { error: (error as Error).message });
    }
  });

  // ── live:availability:update ──
  socket.on('live:availability:update', async (data: AvailabilityUpdateInput) => {
    try {
      const parsed = availabilitySchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, availability } = parsed.data;

      // Rate limit
      const allowed = await deps.rateLimiter.isAllowed(
        `commerce:${userId}:${sessionId}`,
        'live:availability:update'
      );
      if (!allowed) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.RATE_LIMITED, message: 'Too many requests' });
        return;
      }

      const session = await liveSessionRepository.findById(sessionId);
      if (!session || session.hostUserId.toString() !== userId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only the host can update availability' });
        return;
      }

      socket.to(`live:${sessionId}`).emit('live:availability:updated', { sessionId, availability });
      socket.emit('live:availability:updated', { sessionId, availability });

      logger.info('Availability updated in live room', { sessionId, availability, userId });
    } catch (error) {
      logger.error('Error updating availability', { error: (error as Error).message });
    }
  });

  // ── live:shelf:toggle ──
  socket.on('live:shelf:toggle', async (data: ShelfToggleInput) => {
    try {
      const parsed = shelfToggleSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, visible } = parsed.data;

      // Rate limit
      const allowed = await deps.rateLimiter.isAllowed(
        `commerce:${userId}:${sessionId}`,
        'live:shelf:toggle'
      );
      if (!allowed) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.RATE_LIMITED, message: 'Too many requests' });
        return;
      }

      const session = await liveSessionRepository.findById(sessionId);
      if (!session || session.hostUserId.toString() !== userId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only the host can toggle shelf' });
        return;
      }

      socket.to(`live:${sessionId}`).emit('live:shelf:updated', { sessionId, visible });
      socket.emit('live:shelf:updated', { sessionId, visible });

      logger.info('Product shelf toggled in live room', { sessionId, visible, userId });
    } catch (error) {
      logger.error('Error toggling shelf', { error: (error as Error).message });
    }
  });

  // ── disconnect ──
  socket.on('disconnect', async (reason) => {
    try {
      // Find all rooms this socket was in and clean up
      const rooms = Array.from(socket.rooms);
      const liveRooms = rooms.filter((r) => r.startsWith('live:'));

      for (const room of liveRooms) {
        const sessionId = room.replace('live:', '');

        const entry = await deps.presence.removePresence(sessionId, socket.id);

        if (entry) {
          // Decrement viewer count (hosts not counted)
          let viewerCount = await deps.viewerCount.getCount(sessionId);
          if (entry.role !== 'host') {
            viewerCount = await deps.viewerCount.decrement(sessionId);
          }

          // Remove participant from MongoDB and decrement DB viewer count
          try {
            await deps.sessionService.leaveSession(sessionId, userId!);
          } catch {
            // Ignore — participant may already be removed
          }

          // Broadcast updates
          socket.to(`live:${sessionId}`).emit('live:presence', {
            sessionId,
            action: 'leave',
            user: entry,
          });

          socket.to(`live:${sessionId}`).emit('live:viewer-count', {
            sessionId,
            count: viewerCount,
          });

          if (entry.role === 'host') {
            socket.to(`live:${sessionId}`).emit('live:host-offline', { sessionId });
          }

          logger.info('Socket disconnected from live room', {
            sessionId,
            userId,
            role: entry.role,
            reason,
            viewerCount,
          });

          // Unsubscribe from broadcast channel
          deps.onLeaveRoom?.(sessionId);
        }
      }
    } catch (error) {
      logger.error('Error handling disconnect cleanup', {
        error: (error as Error).message,
        userId,
      });
    }
  });
}
