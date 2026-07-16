/**
 * Live Chat Socket Handlers
 *
 * Registers all chat events using the middleware pipeline.
 * Business logic delegated to LiveChatService.
 * Broadcasting via ChatBroadcaster (never direct Redis).
 */

import { Socket } from 'socket.io';
import { SocketEventConfig, MiddlewareContext } from './middleware/types';
import { createValidatePayloadMiddleware } from './middleware/validatePayload';
import { createRateLimitMiddleware } from './middleware/rateLimit';
import { LiveRateLimiter } from './rateLimit';
import { LiveChatService } from '../services/LiveChatService';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { liveModerationRepository } from '../repositories/LiveModerationRepository';
import {
  chatSendSchema,
  chatHistorySchema,
  chatDeleteSchema,
  chatPinSchema,
} from '../validators';
import { emitError, emitNotFound } from './responses';
import { LIVE_ERROR_CODES } from './types';
import logger from '../../utils/logger';

export interface ChatHandlerDeps {
  chatService: LiveChatService;
  rateLimiter: LiveRateLimiter;
}

/**
 * Create all chat event configurations.
 * These are registered via registerSocketEvents() on each connected socket.
 */
export function createChatEventConfigs(
  deps: ChatHandlerDeps
): SocketEventConfig[] {
  return [
    // ── live:chat:send ──
    {
      event: 'live:chat:send',
      middleware: [
        createRateLimitMiddleware(deps.rateLimiter, 'live:chat:send'),
        createValidatePayloadMiddleware(chatSendSchema),
      ],
      handler: async (socket: Socket, context: MiddlewareContext, _data: unknown) => {
        const userId = (socket as any).user?.id;
        const userRole = (socket as any).user?.role;
        const payload = context.payload as {
          sessionId: string;
          content: string;
          messageId: string;
          replyTo?: string;
          attachments?: Array<{ type: string; url?: string; refId?: string; metadata?: Record<string, unknown> }>;
        };

        // Check slow mode
        const slowMode = await deps.chatService.enforceSlowMode(userId, userRole, payload.sessionId);
        if (!slowMode.allowed) {
          socket.emit('live:chat:error' as any, {
            code: LIVE_ERROR_CODES.SLOW_MODE,
            message: `Slow mode active. Wait ${Math.ceil((slowMode.waitMs || 0) / 1000)}s`,
          });
          return;
        }

        // Check if user is muted (hosts cannot be muted)
        const session = await liveSessionRepository.findById(payload.sessionId);
        const isHost = session?.hostUserId?.toString() === userId;
        if (!isHost) {
          const isMuted = await liveModerationRepository.isUserMuted(payload.sessionId, userId);
          if (isMuted) {
            socket.emit('live:chat:error' as any, {
              code: LIVE_ERROR_CODES.PERMISSION_DENIED,
              message: 'You are muted and cannot send messages',
            });
            return;
          }
        }

        // Check if user is in room
        const roomName = `live:${payload.sessionId}`;
        if (!socket.rooms.has(roomName)) {
          emitError(socket, LIVE_ERROR_CODES.ROOM_NOT_FOUND, 'Not in room');
          return;
        }

        const result = await deps.chatService.sendMessage({
          sessionId: payload.sessionId,
          senderId: userId,
          senderName: (socket as any).user?.name || `User ${userId.slice(-4)}`,
          senderAvatar: (socket as any).user?.avatar,
          content: payload.content,
          messageId: payload.messageId,
          replyTo: payload.replyTo,
          attachments: payload.attachments as any,
        });

        if (!result.success) {
          socket.emit('live:chat:error' as any, {
            code: LIVE_ERROR_CODES.INTERNAL_ERROR,
            message: result.error,
          });
          return;
        }

        // Send ack to sender with the persisted message
        socket.emit('live:chat:ack' as any, {
          success: true,
          messageId: payload.messageId,
          serverMessageId: result.message?._id?.toString(),
          sequenceNumber: result.message?.sequenceNumber,
        });
      },
    },

    // ── live:chat:history ──
    {
      event: 'live:chat:history',
      middleware: [
        createValidatePayloadMiddleware(chatHistorySchema),
      ],
      handler: async (socket: Socket, context: MiddlewareContext, _data: unknown) => {
        const payload = context.payload as {
          sessionId: string;
          cursor?: string;
          limit?: number;
        };

        // Check if user is in room
        const roomName = `live:${payload.sessionId}`;
        if (!socket.rooms.has(roomName)) {
          emitError(socket, LIVE_ERROR_CODES.ROOM_NOT_FOUND, 'Not in room');
          return;
        }

        const result = await deps.chatService.loadHistory(
          payload.sessionId,
          payload.cursor,
          payload.limit || 50
        );

        socket.emit('live:chat:history' as any, {
          sessionId: payload.sessionId,
          messages: result.messages.map((m) => ({
            id: m._id?.toString(),
            senderId: m.senderId?.toString(),
            senderName: m.senderName,
            senderAvatar: m.senderAvatar,
            content: m.content,
            messageId: m.messageId,
            sequenceNumber: m.sequenceNumber,
            type: m.type,
            replyTo: m.replyTo?.toString(),
            createdAt: m.createdAt,
          })),
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        });
      },
    },

    // ── live:chat:delete ──
    {
      event: 'live:chat:delete',
      middleware: [
        createValidatePayloadMiddleware(chatDeleteSchema),
      ],
      handler: async (socket: Socket, context: MiddlewareContext, _data: unknown) => {
        const userId = (socket as any).user?.id;
        const userRole = (socket as any).user?.role;
        const payload = context.payload as {
          messageId: string;
          sessionId: string;
          reason?: string;
        };

        const session = await liveSessionRepository.findById(payload.sessionId);
        const isHost = session?.hostUserId?.toString() === userId;

        // Permission check
        if (!deps.chatService.canDeleteMessage(userId, userRole, '', isHost)) {
          emitError(socket, LIVE_ERROR_CODES.PERMISSION_DENIED, 'Not authorized to delete this message');
          return;
        }

        const result = await deps.chatService.deleteMessage(
          payload.messageId,
          payload.sessionId,
          userId,
          payload.reason
        );

        if (!result.success) {
          emitError(socket, LIVE_ERROR_CODES.INTERNAL_ERROR, result.error || 'Failed to delete message');
          return;
        }

        socket.emit('live:chat:deleted' as any, {
          success: true,
          messageId: payload.messageId,
        });
      },
    },

    // ── live:chat:pin ──
    {
      event: 'live:chat:pin',
      middleware: [
        createValidatePayloadMiddleware(chatPinSchema),
      ],
      handler: async (socket: Socket, context: MiddlewareContext, _data: unknown) => {
        const userId = (socket as any).user?.id;
        const userRole = (socket as any).user?.role;
        const payload = context.payload as {
          messageId: string;
          sessionId: string;
        };

        const session = await liveSessionRepository.findById(payload.sessionId);
        const isHost = session?.hostUserId?.toString() === userId;

        if (!deps.chatService.canPinMessage(userRole, isHost)) {
          emitError(socket, LIVE_ERROR_CODES.PERMISSION_DENIED, 'Only host or moderators can pin messages');
          return;
        }

        const result = await deps.chatService.pinMessage(payload.messageId, payload.sessionId);

        if (!result.success) {
          emitError(socket, LIVE_ERROR_CODES.INTERNAL_ERROR, result.error || 'Failed to pin message');
          return;
        }

        socket.emit('live:chat:pinned' as any, {
          success: true,
          messageId: payload.messageId,
        });
      },
    },
  ];
}
