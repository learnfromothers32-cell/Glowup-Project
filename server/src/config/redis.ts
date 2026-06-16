import { appConfig } from './app';
import logger from '../utils/logger';

export type RedisClientLike = {
  on(event: 'error', callback: (error: Error) => void): void;
  connect(): Promise<void>;
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<string | null>;
  del(key: string | string[]): Promise<number>;
  zIncrBy(key: string, increment: number, member: string): Promise<number>;
  zScore(key: string, member: string): Promise<number | null>;
  zRange(key: string, start: number, stop: number, options?: { BY?: 'BYSCORE' | 'BYLEX'; REV?: boolean; WITHSCORES?: boolean }): Promise<string[]>;
  hGetAll(key: string): Promise<Record<string, string>>;
  hIncrBy(key: string, field: string, increment: number): Promise<number>;
  keys(pattern: string): Promise<string[]>;
};

let redisClient: RedisClientLike | null = null;

export const connectRedis = async (): Promise<void> => {
  if (!appConfig.redisUrl) {
    logger.info('Redis skipped: REDIS_URL is not configured');
    return;
  }

  try {
    const mod = await import('redis').catch(() => null as any);

    if (!mod) {
      logger.info('Redis skipped: package is not installed');
      return;
    }

    const client = mod.createClient({
      url: appConfig.redisUrl
    });

    client.on('error', (err: Error) => {
      logger.error('Redis error:', { error: err.message });
    });

    await client.connect();
    redisClient = client as RedisClientLike;
    logger.info('Redis connected');
  } catch (error) {
    logger.error('Redis connection failed', { error: (error as Error).message });
  }
};

export { redisClient };