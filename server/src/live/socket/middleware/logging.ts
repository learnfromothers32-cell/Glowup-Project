/**
 * Logging Middleware
 *
 * Logs event execution with context.
 * Captures timing, user, session, and error information.
 */

import { Socket } from 'socket.io';
import logger from '../../../utils/logger';
import { SocketMiddleware, MiddlewareContext } from './types';

/**
 * Create middleware that logs event processing.
 * Logs at start and end of handler execution with timing.
 */
export function createLoggingMiddleware(): SocketMiddleware {
  return (socket: Socket, context: MiddlewareContext, data: unknown, next) => {
    const userId = (socket as any).user?.id || 'unknown';
    const startTime = Date.now();

    context.startTime = startTime;
    context.meta.processedAt = new Date().toISOString();

    // Call next — the pipeline will continue, and we'll log after
    next();
  };
}

/**
 * Create a post-handler logging function.
 * Call this after the middleware pipeline completes to log the result.
 */
export function logEventCompletion(
  event: string,
  socket: Socket,
  context: MiddlewareContext,
  error?: Error | string | null
): void {
  const duration = context.startTime ? Date.now() - context.startTime : 0;
  const userId = (socket as any).user?.id || 'unknown';

  if (error) {
    logger.warn('Socket event failed', {
      event,
      userId,
      sessionId: context.sessionId,
      duration,
      error: typeof error === 'string' ? error : error.message,
    });
  } else {
    logger.debug('Socket event processed', {
      event,
      userId,
      sessionId: context.sessionId,
      duration,
    });
  }
}
