import { Document, Schema, Types, model } from 'mongoose';
import { ModerationAction } from '../types';

export interface ILiveModeration extends Document {
  id: string;
  sessionId: Types.ObjectId;
  action: ModerationAction;
  targetUserId?: Types.ObjectId;
  targetMessageId?: Types.ObjectId;
  performedBy: Types.ObjectId;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const liveModerationSchema = new Schema<ILiveModeration>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'mute',
        'unmute',
        'kick',
        'ban',
        'unban',
        'delete_message',
        'report',
        'slow_mode_change',
        'chat_toggle',
        'gifts_toggle',
      ],
      required: true,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    targetMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveChatMessage',
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes ──

// Moderation audit log for session
liveModerationSchema.index({ sessionId: 1, createdAt: -1 });

// Check if user is banned/muted
liveModerationSchema.index({ sessionId: 1, targetUserId: 1 });

// Filtered audit log queries
liveModerationSchema.index({ sessionId: 1, action: 1, createdAt: -1 });

export const LiveModeration = model<ILiveModeration>('LiveModeration', liveModerationSchema);
