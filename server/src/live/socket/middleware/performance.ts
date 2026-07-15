/**
 * Performance Timing Middleware
 *
 * Tracks event execution time using high-resolution timing.
 * Stores timing data in context for metrics collection.
 */

import { Socket } from 'socket.io';
import { SocketMiddleware, MiddlewareContext } from './types';

/**
 * Create middleware that records high-resolution start time.
 * The pipeline runner records end time after handler completes.
 */
export function createPerformanceMiddleware(): SocketMiddleware {
  return (_socket: Socket, context: MiddlewareContext, _data: unknown, next) => {
    context.startTime = performance.now();
    next();
  };
}

/**
 * Calculate elapsed time from context start.
 */
export function getElapsedMs(context: MiddlewareContext): number {
  if (!context.startTime) return 0;
  return performance.now() - context.startTime;
}
