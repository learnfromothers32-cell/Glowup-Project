import { Document, Schema, Types, model } from 'mongoose';
import { ParticipantRole } from '../types';

export interface ILiveParticipant extends Document {
  id: string;
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  watchDurationMs: number;
  isMuted: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const liveParticipantSchema = new Schema<ILiveParticipant>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['host', 'moderator', 'viewer'],
      default: 'viewer',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    leftAt: {
      type: Date,
    },
    watchDurationMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes ──

// Find all participants in a session
liveParticipantSchema.index({ sessionId: 1, joinedAt: -1 });

// Find user's participation history
liveParticipantSchema.index({ userId: 1, joinedAt: -1 });

// Check if user is already in session (prevent duplicates)
liveParticipantSchema.index(
  { sessionId: 1, userId: 1 },
  { unique: true }
);

// Find active participants (not left)
liveParticipantSchema.index(
  { sessionId: 1, leftAt: 1 },
  { partialFilterExpression: { leftAt: null } }
);

// Find banned users in session
liveParticipantSchema.index(
  { sessionId: 1, isBanned: 1 },
  { partialFilterExpression: { isBanned: true } }
);

export const LiveParticipant = model<ILiveParticipant>('LiveParticipant', liveParticipantSchema);
