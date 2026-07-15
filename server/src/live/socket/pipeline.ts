/**
 * Socket Event Pipeline
 *
 * Event registration system and middleware execution engine.
 * Future handlers register events with a middleware chain.
 * The pipeline executes middleware sequentially, aborting on error.
 *
 * Usage:
 *   registerEvent({
 *     event: 'live:chat:send',
 *     middleware: [authenticate, authorize, validateRoom, rateLimit, validatePayload],
 *     handler: sendMessage
 *   });
 */

import { Socket } from 'socket.io';
import {
  SocketMiddleware,
  SocketHandler,
  SocketEventConfig,
  MiddlewareContext,
} from './middleware/types';
import { logEventCompletion } from './middleware/logging';
import { getElapsedMs } from './middleware/performance';
import { LiveSocketMetrics } from './metrics';
import logger from '../../utils/logger';

/**
 * Execute a middleware pipeline for a socket event.
 * Middleware runs sequentially. If any middleware calls next(error),
 * the chain stops and the error is handled.
 */
function runMiddlewarePipeline(
  socket: Socket,
  context: MiddlewareContext,
  data: unknown,
  middleware: SocketMiddleware[],
  index: number = 0,
  finalHandler: SocketHandler
): void {
  if (index >= middleware.length) {
    // All middleware passed — execute the handler
    finalHandler(socket, context, data);
    return;
  }

  const mw = middleware[index];
  mw(socket, context, data, (error?: Error | string | null) => {
    if (error) {
      // Middleware rejected — propagate error to caller
      const err = typeof error === 'string' ? new Error(error) : error;
      throw err;
    }
    // Continue to next middleware
    runMiddlewarePipeline(socket, context, data, middleware, index + 1, finalHandler);
  });
}

/**
 * Register a socket event with middleware pipeline.
 *
 * Returns a function that, when called with the socket's event data,
 * runs the full middleware chain and handler.
 */
export function registerSocketEvent(
  socket: Socket,
  config: SocketEventConfig,
  metrics?: LiveSocketMetrics
): void {
  socket.on(config.event, async (data: unknown) => {
    const context: MiddlewareContext = { meta: {} };

    try {
      // Wrap handler with timing and logging
      const timedHandler: SocketHandler = async (s, ctx, d) => {
        const start = performance.now();

        try {
          await config.handler(s, ctx, d);
          const duration = performance.now() - start;

          metrics?.recordEventLatency(config.event, duration);
        } catch (handlerError) {
          const duration = performance.now() - start;
          metrics?.recordEventLatency(config.event, duration);
          metrics?.incrementErrorCount(config.event);
          throw handlerError;
        }
      };

      runMiddlewarePipeline(socket, context, data, config.middleware, 0, timedHandler);
    } catch (error) {
      const durationMs = getElapsedMs(context);
      const userId = (socket as any).user?.id || 'unknown';

      logEventCompletion(config.event, socket, context, error as Error);
      metrics?.recordEventLatency(config.event, durationMs);
      metrics?.incrementErrorCount(config.event);

      // Emit standardized error to client
      socket.emit('live:error', {
        code: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  });
}

/**
 * Register multiple socket events at once.
 */
export function registerSocketEvents(
  socket: Socket,
  configs: SocketEventConfig[],
  metrics?: LiveSocketMetrics
): void {
  for (const config of configs) {
    registerSocketEvent(socket, config, metrics);
  }
}
