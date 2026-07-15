/**
 * Authentication Middleware
 *
 * Verifies JWT token from socket handshake.
 * Sets context.user if valid.
 * Rejects connection if invalid or missing.
 */

import { Socket } from 'socket.io';
import { verifyAccessToken } from '../../../utils/token';
import { SocketMiddleware, MiddlewareContext } from './types';

export function createAuthMiddleware(): SocketMiddleware {
  return (socket: Socket, _context: MiddlewareContext, _data: unknown, next) => {
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
  };
}
