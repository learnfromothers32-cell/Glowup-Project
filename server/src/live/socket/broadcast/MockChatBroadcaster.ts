/**
 * Mock Chat Broadcaster
 *
 * In-memory implementation for testing.
 * No cross-instance delivery — messages go to local subscribers only.
 */

import { ChatBroadcaster, BroadcastHandler, BroadcastMessage } from './types';

export class MockChatBroadcaster implements ChatBroadcaster {
  private handlers = new Map<string, BroadcastHandler>();
  private publishLog: Array<{ sessionId: string; event: string; data: unknown }> = [];

  async connect(): Promise<void> {
    // No-op for mock
  }

  async publish(sessionId: string, event: string, data: unknown): Promise<void> {
    this.publishLog.push({ sessionId, event, data });

    const handler = this.handlers.get(sessionId);
    if (handler) {
      const message: BroadcastMessage = { event, data, sessionId };
      handler(message);
    }
  }

  async subscribe(sessionId: string, handler: BroadcastHandler): Promise<void> {
    this.handlers.set(sessionId, handler);
  }

  async unsubscribe(sessionId: string): Promise<void> {
    this.handlers.delete(sessionId);
  }

  async shutdown(): Promise<void> {
    this.handlers.clear();
    this.publishLog = [];
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  // ── Test helpers ──

  getPublishLog(): Array<{ sessionId: string; event: string; data: unknown }> {
    return [...this.publishLog];
  }

  clearPublishLog(): void {
    this.publishLog = [];
  }
}
