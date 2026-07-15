/**
 * Live Moderation Handlers
 *
 * Handles mute/unmute, ban/unban, delete message, report message/user.
 * Uses existing LiveModeration + LiveParticipant repositories.
 * Creates audit log entries for all moderation actions.
 */

import { Socket } from 'socket.io';
import { liveModerationRepository } from '../repositories/LiveModerationRepository';
import { liveParticipantRepository } from '../repositories/LiveParticipantRepository';
import { liveChatMessageRepository } from '../repositories/LiveChatMessageRepository';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { liveAnalyticsService } from '../services/LiveAnalyticsService';
import {
  muteUserSchema,
  unmuteUserSchema,
  banUserSchema,
  unbanUserSchema,
  reportMessageSchema,
  reportUserSchema,
} from '../validators';
import { LIVE_ERROR_CODES } from './types';
import { emitError, broadcastToRoom } from './responses';
import logger from '../../utils/logger';

export interface ModerationHandlerDeps {
  rateLimiter: any;
}

export function registerModerationHandlers(
  socket: Socket,
  deps: ModerationHandlerDeps
) {
  const userId = (socket as any).user?.id;
  const userRole = (socket as any).user?.role;

  // ── live:mod:mute ──
  socket.on('live:mod:mute', async (data: any) => {
    try {
      const parsed = muteUserSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, userId: targetUserId, reason } = parsed.data;

      // Check permission (host or moderator)
      const session = await liveSessionRepository.findById(sessionId);
      if (!session) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Session not found' });
        return;
      }

      const isHost = session.hostUserId.toString() === userId;
      const participant = await liveParticipantRepository.findBySessionAndUser(sessionId, userId);
      const isModerator = participant?.role === 'moderator';

      if (!isHost && !isModerator) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only host or moderator can mute users' });
        return;
      }

      // Can't mute the host
      if (session.hostUserId.toString() === targetUserId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Cannot mute the host' });
        return;
      }

      // Mute the participant
      await liveParticipantRepository.setMuted(sessionId, targetUserId, true);

      // Create audit log
      await liveModerationRepository.create({
        sessionId,
        action: 'mute',
        targetUserId,
        performedBy: userId,
        reason,
      });

      // Broadcast to room
      broadcastToRoom(socket, sessionId, 'live:mod:user-muted', {
        sessionId,
        userId: targetUserId,
        mutedBy: userId,
      });

      // Notify the muted user directly
      const targetEntry = await liveParticipantRepository.findBySessionAndUser(sessionId, targetUserId);
      if (targetEntry) {
        // Find target socket and emit notification
        socket.to(`live:${sessionId}`).emit('live:mod:notification', {
          sessionId,
          type: 'muted',
          message: 'You have been muted by a moderator',
        });
      }

      logger.info('User muted in live room', { sessionId, targetUserId, mutedBy: userId });
    } catch (error) {
      logger.error('Error muting user', { error: (error as Error).message });
    }
  });

  // ── live:mod:unmute ──
  socket.on('live:mod:unmute', async (data: any) => {
    try {
      const parsed = unmuteUserSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, userId: targetUserId } = parsed.data;

      const session = await liveSessionRepository.findById(sessionId);
      if (!session) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Session not found' });
        return;
      }

      const isHost = session.hostUserId.toString() === userId;
      const participant = await liveParticipantRepository.findBySessionAndUser(sessionId, userId);
      const isModerator = participant?.role === 'moderator';

      if (!isHost && !isModerator) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only host or moderator can unmute users' });
        return;
      }

      await liveParticipantRepository.setMuted(sessionId, targetUserId, false);

      await liveModerationRepository.create({
        sessionId,
        action: 'unmute',
        targetUserId,
        performedBy: userId,
      });

      broadcastToRoom(socket, sessionId, 'live:mod:user-unmuted', {
        sessionId,
        userId: targetUserId,
      });

      logger.info('User unmuted in live room', { sessionId, targetUserId, unmutedBy: userId });
    } catch (error) {
      logger.error('Error unmuting user', { error: (error as Error).message });
    }
  });

  // ── live:mod:ban ──
  socket.on('live:mod:ban', async (data: any) => {
    try {
      const parsed = banUserSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, userId: targetUserId, reason } = parsed.data;

      const session = await liveSessionRepository.findById(sessionId);
      if (!session) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Session not found' });
        return;
      }

      const isHost = session.hostUserId.toString() === userId;
      const participant = await liveParticipantRepository.findBySessionAndUser(sessionId, userId);
      const isModerator = participant?.role === 'moderator';

      if (!isHost && !isModerator) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only host or moderator can ban users' });
        return;
      }

      // Can't ban the host
      if (session.hostUserId.toString() === targetUserId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Cannot ban the host' });
        return;
      }

      // Ban the participant
      await liveParticipantRepository.setBanned(sessionId, targetUserId, true);

      // Create audit log
      await liveModerationRepository.create({
        sessionId,
        action: 'ban',
        targetUserId,
        performedBy: userId,
        reason,
      });

      // Broadcast to room
      broadcastToRoom(socket, sessionId, 'live:mod:user-banned', {
        sessionId,
        userId: targetUserId,
        reason,
      });

      // Notify the banned user
      socket.to(`live:${sessionId}`).emit('live:mod:notification', {
        sessionId,
        type: 'banned',
        message: 'You have been banned from this session',
      });

      logger.info('User banned in live room', { sessionId, targetUserId, bannedBy: userId, reason });
    } catch (error) {
      logger.error('Error banning user', { error: (error as Error).message });
    }
  });

  // ── live:mod:unban ──
  socket.on('live:mod:unban', async (data: any) => {
    try {
      const parsed = unbanUserSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, userId: targetUserId } = parsed.data;

      const session = await liveSessionRepository.findById(sessionId);
      if (!session) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Session not found' });
        return;
      }

      const isHost = session.hostUserId.toString() === userId;
      const participant = await liveParticipantRepository.findBySessionAndUser(sessionId, userId);
      const isModerator = participant?.role === 'moderator';

      if (!isHost && !isModerator) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only host or moderator can unban users' });
        return;
      }

      await liveParticipantRepository.setBanned(sessionId, targetUserId, false);

      await liveModerationRepository.create({
        sessionId,
        action: 'unban',
        targetUserId,
        performedBy: userId,
      });

      broadcastToRoom(socket, sessionId, 'live:mod:user-unbanned', {
        sessionId,
        userId: targetUserId,
      });

      logger.info('User unbanned in live room', { sessionId, targetUserId, unbannedBy: userId });
    } catch (error) {
      logger.error('Error unbanning user', { error: (error as Error).message });
    }
  });

  // ── live:mod:delete ──
  socket.on('live:mod:delete', async (data: any) => {
    try {
      const parsed = reportMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, messageId, reason } = parsed.data;

      const session = await liveSessionRepository.findById(sessionId);
      if (!session) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Session not found' });
        return;
      }

      const isHost = session.hostUserId.toString() === userId;
      const participant = await liveParticipantRepository.findBySessionAndUser(sessionId, userId);
      const isModerator = participant?.role === 'moderator';

      if (!isHost && !isModerator) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only host or moderator can delete messages' });
        return;
      }

      // Soft delete the message
      await liveChatMessageRepository.softDelete(messageId, userId, reason);

      // Create audit log
      await liveModerationRepository.create({
        sessionId,
        action: 'delete_message',
        targetMessageId: messageId as any,
        performedBy: userId,
        reason,
      });

      // Broadcast deletion to room
      broadcastToRoom(socket, sessionId, 'live:mod:message-deleted', {
        sessionId,
        messageId,
      });

      logger.info('Message deleted in live room', { sessionId, messageId, deletedBy: userId });
    } catch (error) {
      logger.error('Error deleting message', { error: (error as Error).message });
    }
  });

  // ── live:mod:report-message ──
  socket.on('live:mod:report-message', async (data: any) => {
    try {
      const parsed = reportMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, messageId, reason } = parsed.data;

      // Check if user already reported
      const hasReported = await liveModerationRepository.hasUserReported(sessionId, userId);
      if (hasReported) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'You have already reported this session' });
        return;
      }

      // Create report
      const report = await liveModerationRepository.create({
        sessionId,
        action: 'report',
        targetMessageId: messageId as any,
        performedBy: userId,
        reason: reason || 'Message reported by user',
      });

      // Record analytics
      liveAnalyticsService.recordReport(sessionId);

      // Confirm to reporter
      socket.emit('live:mod:report-submitted', {
        sessionId,
        reportId: report.id,
      });

      logger.info('Message report submitted', { sessionId, messageId, reportedBy: userId });
    } catch (error) {
      logger.error('Error reporting message', { error: (error as Error).message });
    }
  });

  // ── live:mod:report-user ──
  socket.on('live:mod:report-user', async (data: any) => {
    try {
      const parsed = reportUserSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, userId: targetUserId, reason } = parsed.data;

      // Check if user already reported
      const hasReported = await liveModerationRepository.hasUserReported(sessionId, userId);
      if (hasReported) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'You have already reported this session' });
        return;
      }

      // Create report
      const report = await liveModerationRepository.create({
        sessionId,
        action: 'report',
        targetUserId,
        performedBy: userId,
        reason: reason || 'User reported by viewer',
      });

      // Record analytics
      liveAnalyticsService.recordReport(sessionId);

      // Confirm to reporter
      socket.emit('live:mod:report-submitted', {
        sessionId,
        reportId: report.id,
      });

      logger.info('User report submitted', { sessionId, targetUserId, reportedBy: userId });
    } catch (error) {
      logger.error('Error reporting user', { error: (error as Error).message });
    }
  });
}
