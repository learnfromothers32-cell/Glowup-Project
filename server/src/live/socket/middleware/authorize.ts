/**
 * Authorization Middleware Factory
 *
 * Creates middleware that checks if the authenticated user has the required role.
 * Must run after authenticate middleware.
 */

import { Socket } from 'socket.io';
import { SocketMiddleware, MiddlewareContext } from './types';

/**
 * Create middleware that requires one of the specified roles.
 *
 * @example
 *   createAuthorizeMiddleware('host', 'moderator')
 */
export function createAuthorizeMiddleware(
  ...allowedRoles: string[]
): SocketMiddleware {
  return (socket: Socket, context: MiddlewareContext, _data: unknown, next) => {
    const user = (socket as any).user;

    if (!user) {
      return next(new Error('Not authenticated'));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new Error('Not authorized'));
    }

    context.user = { id: user.id, role: user.role };
    next();
  };
}
