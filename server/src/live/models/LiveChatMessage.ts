import { Document, Schema, Types, model } from 'mongoose';

export interface ILiveChatMessage extends Document {
  id: string;
  sessionId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageId: string; // client-generated UUID for idempotency
  sequenceNumber: number; // per-session monotonic counter
  type: 'normal' | 'pinned' | 'system';
  isDeleted: boolean;
  deletedBy?: Types.ObjectId;
  deletedReason?: string;
  replyTo?: Types.ObjectId;
  attachments: ChatAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatAttachment {
  type: 'image' | 'product' | 'booking' | 'service';
  url?: string;
  refId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
}

const chatAttachmentSchema = new Schema<ChatAttachment>(
  {
    type: {
      type: String,
      enum: ['image', 'product', 'booking', 'service'],
      required: true,
    },
    url: { type: String },
    refId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const liveChatMessageSchema = new Schema<ILiveChatMessage>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    senderAvatar: {
      type: String,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['normal', 'pinned', 'system'],
      default: 'normal',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedReason: {
      type: String,
      maxlength: 200,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'LiveChatMessage',
    },
    attachments: {
      type: [chatAttachmentSchema],
      default: [],
      validate: {
        validator: (attachments: ChatAttachment[]) => attachments.length <= 5,
        message: 'Cannot have more than 5 attachments',
      },
    },
  },
  { timestamps: true }
);

// ── Compound Indexes ──

// Recent history: messages for a session, newest first
liveChatMessageSchema.index({ sessionId: 1, createdAt: -1 });

// Sender queries: find messages by user
liveChatMessageSchema.index({ senderId: 1, createdAt: -1 });

// Pinned messages lookup
liveChatMessageSchema.index({ sessionId: 1, type: 1, createdAt: -1 });

// Sequence number for ordering (unique per session enforced by application)
liveChatMessageSchema.index({ sessionId: 1, sequenceNumber: 1 }, { unique: true });

// Deleted messages filter
liveChatMessageSchema.index({ sessionId: 1, isDeleted: 1, createdAt: -1 });

export const LiveChatMessage = model<ILiveChatMessage>(
  'LiveChatMessage',
  liveChatMessageSchema
);
