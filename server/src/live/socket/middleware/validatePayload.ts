/**
 * Zod Payload Validation Middleware Factory
 *
 * Creates middleware that validates event payloads against a Zod schema.
 * Sets context.payload with the parsed (and possibly transformed) data.
 */

import { Socket } from 'socket.io';
import { ZodSchema } from 'zod';
import { SocketMiddleware, MiddlewareContext } from './types';

/**
 * Create middleware that validates the event data against a Zod schema.
 * On success, context.payload is set to the parsed data.
 * On failure, next() is called with an error containing the validation message.
 */
export function createValidatePayloadMiddleware<T>(
  schema: ZodSchema<T>
): SocketMiddleware {
  return (_socket: Socket, context: MiddlewareContext, data: unknown, next) => {
    const result = schema.safeParse(data);

    if (!result.success) {
      const message = result.error.errors
        .map((e) => e.message)
        .join('; ');
      return next(new Error(`Validation failed: ${message}`));
    }

    context.payload = result.data;
    next();
  };
}
