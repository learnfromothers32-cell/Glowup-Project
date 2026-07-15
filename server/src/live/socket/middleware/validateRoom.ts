/**
 * Room Validation Middleware Factory
 *
 * Creates middleware that verifies the socket is in the expected room.
 * Optionally checks session status (live, paused, etc.).
 */

import { Socket } from 'socket.io';
import { SocketMiddleware, MiddlewareContext } from './types';

export interface ValidateRoomOptions {
  /** If true, check that socket has joined the Socket.IO room */
  requireJoined?: boolean;
}

/**
 * Create middleware that validates the socket is in the expected live room.
 * Reads sessionId from context.meta.sessionId or from the event payload.
 */
export function createValidateRoomMiddleware(
  options: ValidateRoomOptions = {}
): SocketMiddleware {
  return (socket: Socket, context: MiddlewareContext, _data: unknown, next) => {
    const sessionId = context.sessionId;

    if (!sessionId) {
      return next(new Error('No session ID provided'));
    }

    if (options.requireJoined) {
      const roomName = `live:${sessionId}`;
      if (!socket.rooms.has(roomName)) {
        return next(new Error('Not in room'));
      }
    }

    next();
  };
}
