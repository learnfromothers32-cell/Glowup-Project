import { NextFunction, Request, Response } from 'express';
import { appConfig } from '../config/app';
import { ApiError } from '../utils/apiError';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export const csrfProtect = (req: Request, _res: Response, next: NextFunction) => {
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // SPA uses Bearer tokens for auth (not cookies), so CSRF risk is minimal.
  // This check ensures state-changing requests come from the app's origin.

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    // Allow requests without Origin/Referer (e.g., mobile apps, curl, Postman)
    return next();
  }

  const allowedOrigins = [
    appConfig.clientUrl,
    'http://localhost:5173',
    'http://localhost:5000',
  ];

  const originOk = allowedOrigins.some((allowed) => origin?.toString().startsWith(allowed));
  if (!originOk) {
    throw new ApiError(403, 'Cross-origin request blocked');
  }

  next();
};
