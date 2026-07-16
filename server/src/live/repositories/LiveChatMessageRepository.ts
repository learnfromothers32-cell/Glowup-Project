/**
 * Live Chat Message Repository
 *
 * Data access layer for chat messages.
 * No business logic — pure CRUD + indexed queries.
 */

import { Types } from 'mongoose';
import { LiveChatMessage, ILiveChatMessage, ChatAttachment } from '../models/LiveChatMessage';

export interface CreateMessageInput {
  sessionId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageId: string;
  sequenceNumber?: number;
  replyTo?: string;
  attachments?: ChatAttachment[];
}

export interface PaginatedMessages {
  messages: ILiveChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export class LiveChatMessageRepository {
  async create(data: CreateMessageInput): Promise<ILiveChatMessage> {
    return LiveChatMessage.create({
      sessionId: new Types.ObjectId(data.sessionId),
      senderId: new Types.ObjectId(data.senderId),
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      content: data.content,
      messageId: data.messageId,
      sequenceNumber: data.sequenceNumber,
      replyTo: data.replyTo ? new Types.ObjectId(data.replyTo) : undefined,
      attachments: data.attachments || [],
    });
  }

  async findById(id: string): Promise<ILiveChatMessage | null> {
    return LiveChatMessage.findById(id);
  }

  async findByMessageId(messageId: string): Promise<ILiveChatMessage | null> {
    return LiveChatMessage.findOne({ messageId });
  }

  async findRecentMessages(
    sessionId: string,
    limit: number = 50
  ): Promise<ILiveChatMessage[]> {
    return LiveChatMessage.find({
      sessionId: new Types.ObjectId(sessionId),
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit) as any;
  }

  async paginateMessages(
    sessionId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<PaginatedMessages> {
    const query: Record<string, unknown> = {
      sessionId: new Types.ObjectId(sessionId),
      isDeleted: false,
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const messages = await LiveChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1) as ILiveChatMessage[];

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore && result.length > 0
      ? result[result.length - 1].createdAt.toISOString()
      : undefined;

    return { messages: result, hasMore, nextCursor };
  }

  async findMessageByIdAndSession(
    messageId: string,
    sessionId: string
  ): Promise<ILiveChatMessage | null> {
    return LiveChatMessage.findOne({
      _id: new Types.ObjectId(messageId),
      sessionId: new Types.ObjectId(sessionId),
    });
  }

  async softDelete(
    messageId: string,
    deletedBy: string,
    reason?: string
  ): Promise<ILiveChatMessage | null> {
    return LiveChatMessage.findByIdAndUpdate(
      messageId,
      {
        $set: {
          isDeleted: true,
          deletedBy: new Types.ObjectId(deletedBy),
          deletedReason: reason || undefined,
          content: '[message deleted]',
        },
      },
      { new: true }
    );
  }

  async pinMessage(messageId: string): Promise<ILiveChatMessage | null> {
    return LiveChatMessage.findByIdAndUpdate(
      messageId,
      { $set: { type: 'pinned' } },
      { new: true }
    );
  }

  async unpinMessage(messageId: string): Promise<ILiveChatMessage | null> {
    return LiveChatMessage.findByIdAndUpdate(
      messageId,
      { $set: { type: 'normal' } },
      { new: true }
    );
  }

  async getPinnedMessages(sessionId: string): Promise<ILiveChatMessage[]> {
    return LiveChatMessage.find({
      sessionId: new Types.ObjectId(sessionId),
      type: 'pinned',
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(10) as any;
  }

  async getNextSequenceNumber(sessionId: string): Promise<number> {
    // Atomically increment the counter on a session-scoped document.
    // Find the session's message counter or create it, then return the new value.
    const result = await LiveChatMessage.findOneAndUpdate(
      { sessionId: new Types.ObjectId(sessionId) },
      { $inc: { sequenceNumber: 1 } },
      { new: true, upsert: false }
    ).select('sequenceNumber');

    // result.sequenceNumber is already the new value after $inc
    return result?.sequenceNumber ?? 1;
  }

  async countMessages(sessionId: string): Promise<number> {
    return LiveChatMessage.countDocuments({
      sessionId: new Types.ObjectId(sessionId),
      isDeleted: false,
    });
  }

  async deleteMany(sessionId: string): Promise<void> {
    await LiveChatMessage.deleteMany({
      sessionId: new Types.ObjectId(sessionId),
    });
  }
}

export const liveChatMessageRepository = new LiveChatMessageRepository();
