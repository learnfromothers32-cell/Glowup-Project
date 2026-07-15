/**
 * Standardized Socket Response Helpers
 *
 * All socket handlers use these helpers to emit consistent
 * response shapes to clients. Eliminates ad-hoc emit patterns.
 */

import { Socket } from 'socket.io';
import { LIVE_ERROR_CODES } from './types';

// ── Success Responses ──

/**
 * Emit a success acknowledgement.
 */
export function emitSuccess(socket: Socket, data?: unknown): void {
  socket.emit('live:ack', {
    success: true,
    ...(data !== undefined ? { data } : {}),
  });
}

/**
 * Emit a success event with data.
 */
export function emitEvent(
  socket: Socket,
  event: string,
  data: unknown
): void {
  socket.emit(event as any, data);
}

/**
 * Broadcast to a room (all sockets except sender).
 */
export function broadcastToRoom(
  socket: Socket,
  sessionId: string,
  event: string,
  data: unknown
): void {
  socket.to(`live:${sessionId}`).emit(event as any, data);
}

// ── Error Responses ──

export function emitError(
  socket: Socket,
  code: string,
  message: string
): void {
  socket.emit('live:error', { code, message });
}

export function emitValidationError(
  socket: Socket,
  message: string
): void {
  emitError(socket, LIVE_ERROR_CODES.INVALID_PAYLOAD, message);
}

export function emitUnauthorized(
  socket: Socket,
  message: string = 'Not authorized'
): void {
  emitError(socket, LIVE_ERROR_CODES.PERMISSION_DENIED, message);
}

export function emitForbidden(
  socket: Socket,
  message: string = 'Forbidden'
): void {
  emitError(socket, LIVE_ERROR_CODES.PERMISSION_DENIED, message);
}

export function emitRateLimited(
  socket: Socket,
  message: string = 'Too many requests'
): void {
  emitError(socket, LIVE_ERROR_CODES.RATE_LIMITED, message);
}

export function emitNotFound(
  socket: Socket,
  message: string = 'Resource not found'
): void {
  emitError(socket, LIVE_ERROR_CODES.ROOM_NOT_FOUND, message);
}

export function emitInternalError(
  socket: Socket,
  message: string = 'An unexpected error occurred'
): void {
  emitError(socket, LIVE_ERROR_CODES.INTERNAL_ERROR, message);
}

export function emitBanned(
  socket: Socket,
  message: string = 'You are banned from this session'
): void {
  emitError(socket, LIVE_ERROR_CODES.USER_BANNED, message);
}

export function emitMuted(
  socket: Socket,
  message: string = 'You are muted'
): void {
  emitError(socket, LIVE_ERROR_CODES.PERMISSION_DENIED, message);
}
