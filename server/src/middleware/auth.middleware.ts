import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { UserRole } from '../types/auth';
import { ApiError } from '../utils/apiError';
import { verifyAccessToken } from '../utils/token';
import jwt from 'jsonwebtoken';

export const softAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id);
    if (user) {
      req.user = { id: user.id, role: user.role };
    }
  } catch {
    // token invalid or expired — continue without auth
  }
  next();
};

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token required');
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission'));
    }

    next();
  };
