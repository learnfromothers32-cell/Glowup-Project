/**
 * Redis Chat Broadcaster
 *
 * Redis Pub/Sub implementation of ChatBroadcaster.
 * Handles cross-instance event delivery for live streaming.
 *
 * Channel naming: live:broadcast:{sessionId}
 * Each server instance subscribes to channels for rooms it has sockets in.
 * Redis Pub/Sub fans out messages to all subscribers automatically.
 */

import Redis from 'ioredis';
import { ChatBroadcaster, BroadcastHandler, BroadcastMessage } from './types';
import logger from '../../../utils/logger';

export class RedisChatBroadcaster implements ChatBroadcaster {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers = new Map<string, BroadcastHandler>();
  private subscribed = new Set<string>();

  constructor(redisUrl: string) {
    const opts = {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    };

    this.publisher = new Redis(redisUrl, opts);
    this.subscriber = new Redis(redisUrl, opts);
  }

  async connect(): Promise<void> {
    try {
      await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
    } catch (error) {
      logger.warn('RedisChatBroadcaster connection failed', {
        error: (error as Error).message,
      });
    }
  }

  async shutdown(): Promise<void> {
    try {
      // Unsubscribe from all channels
      if (this.subscribed.size > 0) {
        await this.subscriber.unsubscribe(...Array.from(this.subscribed));
      }
      this.handlers.clear();
      this.subscribed.clear();

      await Promise.all([
        this.publisher.quit().catch(() => {}),
        this.subscriber.quit().catch(() => {}),
      ]);
    } catch {
      // ignore
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.publisher.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async publish(sessionId: string, event: string, data: unknown): Promise<void> {
    const channel = this.channelKey(sessionId);
    const message: BroadcastMessage = { event, data, sessionId };

    try {
      await this.publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error('Redis broadcast publish failed', {
        sessionId,
        event,
        error: (error as Error).message,
      });
    }
  }

  async subscribe(sessionId: string, handler: BroadcastHandler): Promise<void> {
    const channel = this.channelKey(sessionId);

    // Already subscribed — just update handler
    if (this.subscribed.has(channel)) {
      this.handlers.set(channel, handler);
      return;
    }

    this.handlers.set(channel, handler);

    // Set up message handler on the subscriber
    this.subscriber.on('message', (ch: string, raw: string) => {
      if (ch !== channel) return;

      try {
        const message: BroadcastMessage = JSON.parse(raw);
        handler(message);
      } catch (error) {
        logger.error('Redis broadcast message parse failed', {
          channel: ch,
          error: (error as Error).message,
        });
      }
    });

    await this.subscriber.subscribe(channel);
    this.subscribed.add(channel);
  }

  async unsubscribe(sessionId: string): Promise<void> {
    const channel = this.channelKey(sessionId);

    if (!this.subscribed.has(channel)) return;

    this.handlers.delete(channel);
    await this.subscriber.unsubscribe(channel);
    this.subscribed.delete(channel);
  }

  private channelKey(sessionId: string): string {
    return `live:broadcast:${sessionId}`;
  }
}
