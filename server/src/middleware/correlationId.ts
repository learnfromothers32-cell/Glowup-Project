import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';

export const correlationId = (req: Request, _res: Response, next: NextFunction) => {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID().slice(0, 8);
  (req as any).requestId = id;
  next();
};

export function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}