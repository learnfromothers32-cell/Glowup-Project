/**
 * Socket-Specific Rate Limiting
 *
 * Protects against:
 * - Join spam (rapid join/leave cycles)
 * - Connection spam (too many connections per user)
 * - Heartbeat abuse (flooding heartbeats)
 * - Reconnect abuse (rapid reconnect loops)
 *
 * Uses Redis-backed sliding window for multi-server support.
 * Falls back to in-memory if Redis is unavailable.
 */

import Redis from 'ioredis';
import logger from '../../utils/logger';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  'live:join': { windowMs: 10_000, maxRequests: 10 },
  'live:leave': { windowMs: 10_000, maxRequests: 20 },
  'live:heartbeat': { windowMs: 5_000, maxRequests: 10 },
  'live:connect': { windowMs: 60_000, maxRequests: 30 },
};

export class LiveRateLimiter {
  private redis: Redis | null = null;
  private memoryBuckets = new Map<string, RateLimitBucket>();
  private configs: Record<string, RateLimitConfig> = {};

  constructor(redisUrl?: string, customConfigs?: Partial<Record<string, RateLimitConfig>>) {
    this.configs = { ...DEFAULT_CONFIGS, ...customConfigs } as Record<string, RateLimitConfig>;

    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy(times: number) {
          if (times > 2) return null;
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });
    }

    // Periodic cleanup of in-memory buckets
    setInterval(() => this.cleanupMemory(), 30_000).unref();
  }

  async connect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.connect();
      } catch {
        logger.warn('LiveRateLimiter Redis unavailable, using in-memory');
        this.redis = null;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Check if a request is allowed. Returns true if allowed, false if rate limited.
   */
  async isAllowed(key: string, action?: string): Promise<boolean> {
    const config = this.configs[action || 'live:join'] || this.configs['live:join'];
    const fullKey = `ratelimit:${key}`;

    if (this.redis) {
      return this.checkRedis(fullKey, config);
    }
    return this.checkMemory(fullKey, config);
  }

  private async checkRedis(key: string, config: RateLimitConfig): Promise<boolean> {
    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Use sorted set with timestamps as scores
      const multi = this.redis!.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, String(now), `${now}:${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, Math.ceil(config.windowMs / 1000));

      const results = await multi.exec();
      if (!results) return false;

      const count = results[2][1] as number;
      return count <= config.maxRequests;
    } catch {
      // Fallback to memory on Redis error
      return this.checkMemory(key, config);
    }
  }

  private checkMemory(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const bucket = this.memoryBuckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      this.memoryBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    bucket.count += 1;
    return bucket.count <= config.maxRequests;
  }

  private cleanupMemory(): void {
    const now = Date.now();
    for (const [key, bucket] of this.memoryBuckets) {
      if (now > bucket.resetAt) {
        this.memoryBuckets.delete(key);
      }
    }
  }
}
