/**
 * Live Chat Service
 *
 * Business logic for chat messages.
 * No direct socket logic — broadcasts through ChatBroadcaster.
 * No direct Redis access — uses ChatBroadcaster abstraction.
 */

import { ILiveChatMessage, ChatAttachment } from '../models/LiveChatMessage';
import {
  liveChatMessageRepository,
  CreateMessageInput,
  PaginatedMessages,
} from '../repositories/LiveChatMessageRepository';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { ChatBroadcaster } from '../socket/broadcast/types';
import logger from '../../utils/logger';

// ── Spam Detection Config ──

const SPAM_CONFIG = {
  /** Max messages per user per window */
  maxMessages: 5,
  /** Window in milliseconds */
  windowMs: 10_000,
  /** Max content length */
  maxContentLength: 500,
  /** Min content length (after trimming) */
  minContentLength: 1,
  /** Duplicate message cooldown */
  duplicateCooldownMs: 5_000,
};

// ── Slow Mode Config ──

const SLOW_MODE_BYPASS_ROLES = ['host', 'moderator', 'admin'];

// ── Moderation Hooks ──

export type ProfanityFilterResult = {
  filtered: boolean;
  content: string;
};

export type SpamCheckResult = {
  isSpam: boolean;
  reason?: string;
};

/**
 * Moderation hook interface.
 * Future phases implement these to plug in AI moderation,
 * blocked words, custom rules, etc.
 */
export interface ModerationHooks {
  profanityFilter?: (content: string) => ProfanityFilterResult;
  spamCheck?: (userId: string, content: string) => Promise<SpamCheckResult>;
  shadowBanCheck?: (userId: string) => Promise<boolean>;
  messageApproval?: (content: string) => Promise<{ approved: boolean; reason?: string }>;
}

export interface SendMessageInput {
  sessionId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageId: string; // client-generated UUID for idempotency
  replyTo?: string;
  attachments?: ChatAttachment[];
}

export interface SendMessageResult {
  success: boolean;
  message?: ILiveChatMessage;
  error?: string;
}

export interface ChatServiceDeps {
  broadcaster: ChatBroadcaster;
  moderation?: ModerationHooks;
}

// ── In-memory spam tracking (per-user, per-session) ──

const spamTracker = new Map<string, number[]>();
const lastMessageTracker = new Map<string, { content: string; timestamp: number }>();

function getSpamKey(userId: string, sessionId: string): string {
  return `${userId}:${sessionId}`;
}

function trackSpam(userId: string, sessionId: string): void {
  const key = getSpamKey(userId, sessionId);
  const now = Date.now();
  const timestamps = spamTracker.get(key) || [];
  const filtered = timestamps.filter((t) => now - t < SPAM_CONFIG.windowMs);
  filtered.push(now);
  spamTracker.set(key, filtered);
}

function getSpamCount(userId: string, sessionId: string): number {
  const key = getSpamKey(userId, sessionId);
  const timestamps = spamTracker.get(key) || [];
  const now = Date.now();
  return timestamps.filter((t) => now - t < SPAM_CONFIG.windowMs).length;
}

function isDuplicate(userId: string, sessionId: string, content: string): boolean {
  const key = getSpamKey(userId, sessionId);
  const last = lastMessageTracker.get(key);
  if (!last) return false;
  return last.content === content && Date.now() - last.timestamp < SPAM_CONFIG.duplicateCooldownMs;
}

function trackMessage(userId: string, sessionId: string, content: string): void {
  const key = getSpamKey(userId, sessionId);
  lastMessageTracker.set(key, { content, timestamp: Date.now() });
}

export class LiveChatService {
  private broadcaster: ChatBroadcaster;
  private moderation: ModerationHooks;

  constructor(deps: ChatServiceDeps) {
    this.broadcaster = deps.broadcaster;
    this.moderation = deps.moderation || {};
  }

  // ── Send Message ──

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const { sessionId, senderId, senderName, senderAvatar, content, messageId, replyTo, attachments } = input;

    // 1. Validate message content
    const validationError = this.validateMessage(content);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // 2. Check idempotency — if messageId already exists, return existing message
    const existing = await liveChatMessageRepository.findByMessageId(messageId);
    if (existing) {
      return { success: true, message: existing };
    }

    // 3. Verify session exists and chat is enabled
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    if (session.status !== 'live' && session.status !== 'paused') {
      return { success: false, error: 'Session is not live' };
    }
    if (!session.settings.chatEnabled) {
      return { success: false, error: 'Chat is disabled' };
    }

    // 4. Check spam protection
    const spamResult = this.checkSpam(senderId, sessionId, content);
    if (spamResult.isSpam) {
      return { success: false, error: spamResult.reason || 'Spam detected' };
    }

    // 5. Run moderation hooks
    let finalContent = content;
    if (this.moderation.profanityFilter) {
      const result = this.moderation.profanityFilter(content);
      if (result.filtered) {
        finalContent = result.content;
      }
    }

    if (this.moderation.shadowBanCheck) {
      const isShadowBanned = await this.moderation.shadowBanCheck(senderId);
      if (isShadowBanned) {
        // Shadow-banned user sees their own messages but no one else does
        // We still persist but don't broadcast
        const message = await this.persistMessage({
          sessionId, senderId, senderName, senderAvatar,
          content: finalContent, messageId, replyTo, attachments,
        });
        return { success: true, message };
      }
    }

    if (this.moderation.messageApproval) {
      const approval = await this.moderation.messageApproval(finalContent);
      if (!approval.approved) {
        return { success: false, error: approval.reason || 'Message not approved' };
      }
    }

    // 6. Persist to MongoDB
    const message = await this.persistMessage({
      sessionId, senderId, senderName, senderAvatar,
      content: finalContent, messageId, replyTo, attachments,
    });

    // 7. Track for spam detection
    trackSpam(senderId, sessionId);
    trackMessage(senderId, sessionId, content);

    // 8. Broadcast via ChatBroadcaster (cross-instance delivery)
    await this.broadcaster.publish(sessionId, 'live:chat:message', {
      message: this.sanitizeMessage(message),
    });

    // 9. Increment session chat count
    await liveSessionRepository.incrementChatMessageCount(sessionId);

    logger.info('Chat message sent', {
      sessionId,
      senderId,
      messageId,
      sequenceNumber: message.sequenceNumber,
    });

    return { success: true, message };
  }

  // ── Delete Message ──

  async deleteMessage(
    messageId: string,
    sessionId: string,
    deletedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const message = await liveChatMessageRepository.findMessageByIdAndSession(messageId, sessionId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    const deleted = await liveChatMessageRepository.softDelete(messageId, deletedBy, reason);
    if (!deleted) {
      return { success: false, error: 'Failed to delete message' };
    }

    await this.broadcaster.publish(sessionId, 'live:chat:deleted', {
      messageId,
      sessionId,
    });

    logger.info('Chat message deleted', { sessionId, messageId, deletedBy });
    return { success: true };
  }

  // ── Pin Message ──

  async pinMessage(
    messageId: string,
    sessionId: string
  ): Promise<{ success: boolean; message?: ILiveChatMessage; error?: string }> {
    const msg = await liveChatMessageRepository.findMessageByIdAndSession(messageId, sessionId);
    if (!msg) {
      return { success: false, error: 'Message not found' };
    }

    const pinned = await liveChatMessageRepository.pinMessage(messageId);
    if (!pinned) {
      return { success: false, error: 'Failed to pin message' };
    }

    await this.broadcaster.publish(sessionId, 'live:chat:pinned', {
      message: this.sanitizeMessage(pinned),
    });

    return { success: true, message: pinned };
  }

  // ── Unpin Message ──

  async unpinnedMessage(
    messageId: string,
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    const msg = await liveChatMessageRepository.findMessageByIdAndSession(messageId, sessionId);
    if (!msg) {
      return { success: false, error: 'Message not found' };
    }

    await liveChatMessageRepository.unpinMessage(messageId);

    await this.broadcaster.publish(sessionId, 'live:chat:unpinned', {
      messageId,
      sessionId,
    });

    return { success: true };
  }

  // ── Load Recent Messages ──

  async loadRecentMessages(sessionId: string, limit: number = 50): Promise<ILiveChatMessage[]> {
    const messages = await liveChatMessageRepository.findRecentMessages(sessionId, limit);
    return messages.reverse(); // Return in chronological order
  }

  // ── Load History (paginated) ──

  async loadHistory(
    sessionId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<PaginatedMessages> {
    const result = await liveChatMessageRepository.paginateMessages(sessionId, cursor, limit);
    // Reverse to chronological order
    result.messages = result.messages.reverse();
    return result;
  }

  // ── Validation ──

  validateMessage(content: string): string | null {
    const trimmed = content.trim();
    if (trimmed.length < SPAM_CONFIG.minContentLength) {
      return 'Message cannot be empty';
    }
    if (trimmed.length > SPAM_CONFIG.maxContentLength) {
      return `Message must be under ${SPAM_CONFIG.maxContentLength} characters`;
    }
    return null;
  }

  // ── Permission Checks ──

  canDeleteMessage(
    userId: string,
    userRole: string,
    messageSenderId: string,
    isHost: boolean
  ): boolean {
    // Host and moderators can delete any message
    if (isHost || userRole === 'moderator' || userRole === 'admin') {
      return true;
    }
    // Users can delete their own messages
    return userId === messageSenderId;
  }

  canPinMessage(userRole: string, isHost: boolean): boolean {
    return isHost || userRole === 'moderator' || userRole === 'admin';
  }

  // ── Slow Mode ──

  async enforceSlowMode(
    userId: string,
    userRole: string,
    sessionId: string
  ): Promise<{ allowed: boolean; waitMs?: number }> {
    // Hosts/moderators/admins bypass slow mode
    if (SLOW_MODE_BYPASS_ROLES.includes(userRole)) {
      return { allowed: true };
    }

    const session = await liveSessionRepository.findById(sessionId);
    if (!session || session.settings.slowModeMs <= 0) {
      return { allowed: true };
    }

    const key = `slowmode:${userId}:${sessionId}`;
    const last = lastMessageTracker.get(key);
    if (!last) {
      return { allowed: true };
    }

    const elapsed = Date.now() - last.timestamp;
    if (elapsed < session.settings.slowModeMs) {
      return { allowed: false, waitMs: session.settings.slowModeMs - elapsed };
    }

    return { allowed: true };
  }

  // ── Private Helpers ──

  private checkSpam(userId: string, sessionId: string, content: string): SpamCheckResult {
    // Rate limit check
    const count = getSpamCount(userId, sessionId);
    if (count >= SPAM_CONFIG.maxMessages) {
      return { isSpam: true, reason: 'Slow down — too many messages' };
    }

    // Duplicate check
    if (isDuplicate(userId, sessionId, content)) {
      return { isSpam: true, reason: 'Duplicate message' };
    }

    // Blank message check (after trimming)
    if (content.trim().length === 0) {
      return { isSpam: true, reason: 'Message cannot be empty' };
    }

    return { isSpam: false };
  }

  private async persistMessage(input: CreateMessageInput): Promise<ILiveChatMessage> {
    const sequenceNumber = await liveChatMessageRepository.getNextSequenceNumber(input.sessionId);
    return liveChatMessageRepository.create({ ...input, sequenceNumber });
  }

  private sanitizeMessage(message: ILiveChatMessage): Record<string, unknown> {
    return {
      id: message._id?.toString() || message.id,
      sessionId: message.sessionId?.toString(),
      senderId: message.senderId?.toString(),
      senderName: message.senderName,
      senderAvatar: message.senderAvatar,
      content: message.content,
      messageId: message.messageId,
      sequenceNumber: message.sequenceNumber,
      type: message.type,
      isDeleted: message.isDeleted,
      replyTo: message.replyTo?.toString(),
      attachments: message.attachments,
      createdAt: message.createdAt,
    };
  }
}
