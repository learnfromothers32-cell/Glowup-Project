/**
 * Redis-Backed Presence System
 *
 * Tracks who is in each live room. Redis is the source of truth.
 * Supports multi-server deployments via Redis.
 *
 * Key structure:
 *   live:presence:{sessionId}  → Hash<socketId, JSON<PresenceEntry>>
 *   live:heartbeat:{sessionId}:{userId} → String (timestamp)
 */

import Redis from 'ioredis';
import { PresenceEntry, SocketRole } from './types';
import logger from '../../utils/logger';

const PRESENCE_TTL_SECONDS = 300; // 5 minutes max without heartbeat
const HEARTBEAT_KEY_TTL = 120; // 2 minutes for heartbeat key

export class LivePresence {
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
      logger.warn('LivePresence Redis connection failed', { error: (error as Error).message });
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      // ignore
    }
  }

  // ── Add user to room presence ──

  async addPresence(
    sessionId: string,
    socketId: string,
    userId: string,
    role: SocketRole,
    displayName: string
  ): Promise<PresenceEntry> {
    const entry: PresenceEntry = {
      userId,
      socketId,
      role,
      displayName,
      joinedAt: Date.now(),
      lastHeartbeat: Date.now(),
    };

    const key = this.presenceKey(sessionId);
    await this.redis.hset(key, socketId, JSON.stringify(entry));
    await this.redis.expire(key, PRESENCE_TTL_SECONDS);

    // Set heartbeat key
    const hbKey = this.heartbeatKey(sessionId, userId);
    await this.redis.set(hbKey, String(Date.now()), 'EX', HEARTBEAT_KEY_TTL);

    return entry;
  }

  // ── Remove user from room presence ──

  async removePresence(sessionId: string, socketId: string): Promise<PresenceEntry | null> {
    const key = this.presenceKey(sessionId);
    const raw = await this.redis.hget(key, socketId);

    if (!raw) return null;

    const entry: PresenceEntry = JSON.parse(raw);
    await this.redis.hdel(key, socketId);

    // Remove heartbeat key
    const hbKey = this.heartbeatKey(sessionId, entry.userId);
    await this.redis.del(hbKey);

    // Clean up empty presence hash
    const remaining = await this.redis.hlen(key);
    if (remaining === 0) {
      await this.redis.del(key);
    }

    return entry;
  }

  // ── Get all users in a room ──

  async getPresence(sessionId: string): Promise<PresenceEntry[]> {
    const key = this.presenceKey(sessionId);
    const all = await this.redis.hgetall(key);

    return Object.values(all).map((raw) => JSON.parse(raw) as PresenceEntry);
  }

  // ── Get presence count ──

  async getPresenceCount(sessionId: string): Promise<number> {
    const key = this.presenceKey(sessionId);
    return this.redis.hlen(key);
  }

  // ── Update heartbeat ──

  async updateHeartbeat(sessionId: string, userId: string): Promise<void> {
    const hbKey = this.heartbeatKey(sessionId, userId);
    await this.redis.set(hbKey, String(Date.now()), 'EX', HEARTBEAT_KEY_TTL);

    // Also update the presence entry's lastHeartbeat
    const key = this.presenceKey(sessionId);
    const all = await this.redis.hgetall(key);

    for (const [socketId, raw] of Object.entries(all)) {
      const entry: PresenceEntry = JSON.parse(raw);
      if (entry.userId === userId) {
        entry.lastHeartbeat = Date.now();
        await this.redis.hset(key, socketId, JSON.stringify(entry));
        break;
      }
    }
  }

  // ── Check if user is in room ──

  async isUserInRoom(sessionId: string, userId: string): Promise<boolean> {
    const entries = await this.getPresence(sessionId);
    return entries.some((e) => e.userId === userId);
  }

  // ── Get host entry ──

  async getHost(sessionId: string): Promise<PresenceEntry | null> {
    const entries = await this.getPresence(sessionId);
    return entries.find((e) => e.role === 'host') || null;
  }

  // ── Clean stale entries (no heartbeat within TTL) ──

  async cleanStale(sessionId: string): Promise<PresenceEntry[]> {
    const now = Date.now();
    const entries = await this.getPresence(sessionId);
    const stale: PresenceEntry[] = [];

    for (const entry of entries) {
      if (now - entry.lastHeartbeat > PRESENCE_TTL_SECONDS * 1000) {
        stale.push(entry);
        const key = this.presenceKey(sessionId);
        await this.redis.hdel(key, entry.socketId);
      }
    }

    return stale;
  }

  // ── Keys ──

  private presenceKey(sessionId: string): string {
    return `live:presence:${sessionId}`;
  }

  private heartbeatKey(sessionId: string, userId: string): string {
    return `live:heartbeat:${sessionId}:${userId}`;
  }
}
