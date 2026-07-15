/**
 * Chat Broadcaster Interface
 *
 * Abstraction for real-time event broadcasting across server instances.
 * Business logic depends only on this interface — never on Redis, NATS, Kafka, etc.
 *
 * Implementations:
 *   - RedisChatBroadcaster: Redis Pub/Sub (production)
 *   - MockChatBroadcaster: In-memory (testing)
 */

export interface BroadcastMessage {
  event: string;
  data: unknown;
  sessionId: string;
}

export type BroadcastHandler = (message: BroadcastMessage) => void;

/**
 * Provider-agnostic broadcasting interface.
 * All chat and future real-time features use this to publish/subscribe.
 */
export interface ChatBroadcaster {
  /**
   * Connect to the broadcasting backend.
   */
  connect(): Promise<void>;

  /**
   * Publish an event to a session's channel.
   * Cross-instance delivery is guaranteed by the implementation.
   */
  publish(sessionId: string, event: string, data: unknown): Promise<void>;

  /**
   * Subscribe to events on a session's channel.
   * Handler is called for every message received (from any server instance).
   */
  subscribe(sessionId: string, handler: BroadcastHandler): Promise<void>;

  /**
   * Unsubscribe from a session's channel.
   * No further events will be delivered to the handler.
   */
  unsubscribe(sessionId: string): Promise<void>;

  /**
   * Gracefully shut down all connections and subscriptions.
   */
  shutdown(): Promise<void>;

  /**
   * Health check — returns true if the broadcaster is connected and operational.
   */
  isHealthy(): Promise<boolean>;
}
