/**
 * Socket Rate Limiting Middleware Factory
 *
 * Creates middleware that rate-limits events using a LiveRateLimiter instance.
 */

import { Socket } from 'socket.io';
import { LiveRateLimiter } from '../rateLimit';
import { SocketMiddleware, MiddlewareContext } from './types';

/**
 * Create middleware that checks rate limits before proceeding.
 *
 * @param rateLimiter - The rate limiter instance
 * @param action - The rate limit action name (e.g., 'live:chat:send')
 * @param keyFn - Optional function to generate the rate limit key. Default: `userId:event`
 */
export function createRateLimitMiddleware(
  rateLimiter: LiveRateLimiter,
  action: string,
  keyFn?: (socket: Socket, context: MiddlewareContext) => string
): SocketMiddleware {
  return async (socket: Socket, context: MiddlewareContext, _data: unknown, next) => {
    const userId = (socket as any).user?.id || socket.id;
    const key = keyFn
      ? keyFn(socket, context)
      : `${userId}:${action}`;

    const allowed = await rateLimiter.isAllowed(key, action);
    if (!allowed) {
      return next(new Error('Rate limited'));
    }

    next();
  };
}
