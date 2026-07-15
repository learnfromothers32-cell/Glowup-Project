/**
 * Socket Middleware Types
 *
 * Shared interfaces for the composable middleware pipeline.
 * Every socket event flows through the same chain:
 *
 *   authenticate → authorize → validateRoom → rateLimit → validatePayload → logging → handler
 */

import { Socket } from 'socket.io';
import { ZodSchema } from 'zod';

/**
 * Middleware context — shared state passed through the chain.
 * Each middleware can read from and write to this context.
 */
export interface MiddlewareContext {
  /** Authenticated user (set by authenticate middleware) */
  user?: { id: string; role: string };
  /** Session ID being operated on (set by validateRoom or payload) */
  sessionId?: string;
  /** Parsed/validated payload (set by validatePayload) */
  payload?: unknown;
  /** Performance timing start (set by performance middleware) */
  startTime?: number;
  /** Custom metadata for logging */
  meta: Record<string, unknown>;
}

/**
 * A single middleware function.
 * Call `next()` to proceed to the next middleware.
 * Call `next(error)` to abort the chain with an error.
 */
export type SocketMiddleware = (
  socket: Socket,
  context: MiddlewareContext,
  data: unknown,
  next: (error?: Error | string | null) => void
) => void | Promise<void>;

/**
 * A handler function — the final step in the pipeline.
 */
export type SocketHandler = (
  socket: Socket,
  context: MiddlewareContext,
  data: unknown
) => void | Promise<void>;

/**
 * Configuration for a registered socket event.
 */
export interface SocketEventConfig {
  /** Event name (e.g., 'live:chat:send') */
  event: string;
  /** Middleware chain executed before the handler */
  middleware: SocketMiddleware[];
  /** The actual business logic handler */
  handler: SocketHandler;
}
