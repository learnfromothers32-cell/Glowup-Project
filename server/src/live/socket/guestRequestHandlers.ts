/**
 * Live Guest Request Handlers
 *
 * Handles viewer request to join, host accept/reject workflow.
 * Does NOT implement multi-person video — only the request workflow.
 */

import { Socket } from 'socket.io';
import { liveGuestRequestRepository } from '../repositories/LiveGuestRequestRepository';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { liveParticipantRepository } from '../repositories/LiveParticipantRepository';
import { liveAnalyticsService } from '../services/LiveAnalyticsService';
import { guestRequestSchema, guestRequestActionSchema } from '../validators';
import { LIVE_ERROR_CODES } from './types';
import { broadcastToRoom } from './responses';
import logger from '../../utils/logger';

export interface GuestRequestHandlerDeps {
  rateLimiter: any;
}

export function registerGuestRequestHandlers(
  socket: Socket,
  deps: GuestRequestHandlerDeps
) {
  const userId = (socket as any).user?.id;
  const userRole = (socket as any).user?.role;

  // ── live:guest:request ──
  socket.on('live:guest:request', async (data: any) => {
    try {
      const parsed = guestRequestSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, reason } = parsed.data;

      // Verify session exists and is live
      const session = await liveSessionRepository.findById(sessionId);
      if (!session || session.status !== 'live') {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Session not found or not live' });
        return;
      }

      // Check if user already has a pending request
      const existingRequest = await liveGuestRequestRepository.findBySessionAndViewer(sessionId, userId);
      if (existingRequest && existingRequest.status === 'pending') {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.DUPLICATE_JOIN, message: 'You already have a pending request' });
        return;
      }

      // Get display name from participant or socket
      const displayName = (socket as any).user?.name || 'Anonymous Viewer';

      // Create request
      const request = await liveGuestRequestRepository.create({
        sessionId,
        viewerId: userId,
        displayName,
        reason,
      });

      // Record analytics
      liveAnalyticsService.recordGuestRequest(sessionId);

      // Notify host (broadcast to room, host will pick it up)
      broadcastToRoom(socket, sessionId, 'live:guest:request-received', {
        sessionId,
        requestId: request.id,
        displayName,
        reason,
      });

      // Confirm to requester
      socket.emit('live:guest:request-status', {
        sessionId,
        status: 'pending',
      });

      logger.info('Guest request submitted', { sessionId, viewerId: userId, requestId: request.id });
    } catch (error) {
      logger.error('Error submitting guest request', { error: (error as Error).message });
    }
  });

  // ── live:guest:cancel ──
  socket.on('live:guest:cancel', async (data: any) => {
    try {
      const parsed = guestRequestSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId } = parsed.data;

      const cancelled = await liveGuestRequestRepository.cancelByViewer(sessionId, userId);
      if (!cancelled) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'No pending request found' });
        return;
      }

      // Broadcast cancellation to room
      broadcastToRoom(socket, sessionId, 'live:guest:request-cancelled', {
        sessionId,
        requestId: cancelled.id,
      });

      // Confirm to requester
      socket.emit('live:guest:request-status', {
        sessionId,
        status: 'cancelled',
      });

      logger.info('Guest request cancelled', { sessionId, viewerId: userId });
    } catch (error) {
      logger.error('Error cancelling guest request', { error: (error as Error).message });
    }
  });

  // ── live:guest:accept ──
  socket.on('live:guest:accept', async (data: any) => {
    try {
      const parsed = guestRequestActionSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, requestId } = parsed.data;

      // Only host can accept
      const session = await liveSessionRepository.findById(sessionId);
      if (!session || session.hostUserId.toString() !== userId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only the host can accept guest requests' });
        return;
      }

      // Find the request
      const request = await liveGuestRequestRepository.findById(requestId);
      if (!request || request.sessionId.toString() !== sessionId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Request not found' });
        return;
      }

      if (request.status !== 'pending') {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Request is no longer pending' });
        return;
      }

      // Accept the request
      await liveGuestRequestRepository.updateStatus(requestId, 'accepted', userId);

      // Broadcast acceptance to room
      broadcastToRoom(socket, sessionId, 'live:guest:request-accepted', {
        sessionId,
        requestId,
      });

      logger.info('Guest request accepted', { sessionId, requestId, hostId: userId });
    } catch (error) {
      logger.error('Error accepting guest request', { error: (error as Error).message });
    }
  });

  // ── live:guest:reject ──
  socket.on('live:guest:reject', async (data: any) => {
    try {
      const parsed = guestRequestActionSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
        return;
      }

      const { sessionId, requestId } = parsed.data;

      // Only host can reject
      const session = await liveSessionRepository.findById(sessionId);
      if (!session || session.hostUserId.toString() !== userId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Only the host can reject guest requests' });
        return;
      }

      // Find the request
      const request = await liveGuestRequestRepository.findById(requestId);
      if (!request || request.sessionId.toString() !== sessionId) {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.ROOM_NOT_FOUND, message: 'Request not found' });
        return;
      }

      if (request.status !== 'pending') {
        socket.emit('live:error', { code: LIVE_ERROR_CODES.PERMISSION_DENIED, message: 'Request is no longer pending' });
        return;
      }

      // Reject the request
      await liveGuestRequestRepository.updateStatus(requestId, 'rejected', userId);

      // Broadcast rejection to room
      broadcastToRoom(socket, sessionId, 'live:guest:request-rejected', {
        sessionId,
        requestId,
      });

      logger.info('Guest request rejected', { sessionId, requestId, hostId: userId });
    } catch (error) {
      logger.error('Error rejecting guest request', { error: (error as Error).message });
    }
  });
}
