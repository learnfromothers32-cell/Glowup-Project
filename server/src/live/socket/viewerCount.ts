/**
 * Redis-Backed Viewer Count
 *
 * Atomic viewer count synchronization across server instances.
 * Uses Redis INCR/DECR for accurate counting.
 *
 * Key structure:
 *   live:viewers:{sessionId} → Integer (current viewer count)
 *   live:peak:{sessionId}    → Integer (peak viewer count)
 */

import Redis from 'ioredis';
import logger from '../../utils/logger';

const VIEWER_COUNT_TTL = 3600; // 1 hour auto-cleanup

export class LiveViewerCount {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      logger.warn('LiveViewerCount Redis connection failed', { error: (error as Error).message });
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      // ignore
    }
  }

  // ── Increment viewer count ──

  async increment(sessionId: string): Promise<number> {
    const key = this.viewerKey(sessionId);
    const count = await this.redis.incr(key);
    await this.redis.expire(key, VIEWER_COUNT_TTL);

    // Update peak if needed
    const peakKey = this.peakKey(sessionId);
    const peak = await this.redis.get(peakKey);
    if (!peak || count > parseInt(peak, 10)) {
      await this.redis.set(peakKey, String(count), 'EX', VIEWER_COUNT_TTL);
    }

    return count;
  }

  // ── Decrement viewer count ──

  async decrement(sessionId: string): Promise<number> {
    const key = this.viewerKey(sessionId);
    const count = await this.redis.decr(key);

    // Prevent negative counts
    if (count < 0) {
      await this.redis.set(key, '0', 'EX', VIEWER_COUNT_TTL);
      return 0;
    }

    return count;
  }

  // ── Get current count ──

  async getCount(sessionId: string): Promise<number> {
    const key = this.viewerKey(sessionId);
    const raw = await this.redis.get(key);
    return raw ? parseInt(raw, 10) : 0;
  }

  // ── Get peak count ──

  async getPeak(sessionId: string): Promise<number> {
    const key = this.peakKey(sessionId);
    const raw = await this.redis.get(key);
    return raw ? parseInt(raw, 10) : 0;
  }

  // ── Reset count (when session ends) ──

  async reset(sessionId: string): Promise<void> {
    const key = this.viewerKey(sessionId);
    const peakKey = this.peakKey(sessionId);
    await this.redis.del(key);
    await this.redis.del(peakKey);
  }

  // ── Keys ──

  private viewerKey(sessionId: string): string {
    return `live:viewers:${sessionId}`;
  }

  private peakKey(sessionId: string): string {
    return `live:peak:${sessionId}`;
  }
}
