import { Document, Schema, Types, model } from 'mongoose';
import { LiveSessionStatus, LiveSessionSettings, PinnedProduct, PinnedService } from '../types';

export interface ILiveSession extends Document {
  id: string;
  stylistId: Types.ObjectId;
  hostUserId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: LiveSessionStatus;
  roomName: string;
  viewerCount: number;
  peakViewerCount: number;
  totalViews: number;
  uniqueViewerCount: number;
  likeCount: number;
  chatMessageCount: number;
  giftCount: number;
  totalGiftValue: number;
  bookingCount: number;
  settings: LiveSessionSettings;
  pinnedProducts: PinnedProduct[];
  pinnedServices: PinnedService[];
  scheduledAt?: Date;
  startedAt?: Date;
  pausedAt?: Date;
  endedAt?: Date;
  durationMs: number;
  replayUrl?: string;
  thumbnailUrl?: string;
  replayStatus: 'none' | 'processing' | 'ready' | 'failed';
  averageWatchTimeMs: number;
  reportCount: number;
  isUnderReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
    },
    hostUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 10,
        message: 'Tags cannot exceed 10 items',
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'paused', 'ended'],
      default: 'scheduled',
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
    },
    viewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    peakViewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueViewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    chatMessageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    giftCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGiftValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    settings: {
      chatEnabled: { type: Boolean, default: true },
      slowModeMs: { type: Number, default: 0, min: 0 },
      followersOnly: { type: Boolean, default: false },
      giftsEnabled: { type: Boolean, default: true },
      recordingEnabled: { type: Boolean, default: true },
      maxViewers: { type: Number, default: 10000, min: 1 },
    },
    pinnedProducts: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        pinnedAt: { type: Date, default: Date.now },
      },
    ],
    pinnedServices: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
        pinnedAt: { type: Date, default: Date.now },
      },
    ],
    scheduledAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    pausedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    replayUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    replayStatus: {
      type: String,
      enum: ['none', 'processing', 'ready', 'failed'],
      default: 'none',
    },
    averageWatchTimeMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isUnderReview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes ──

// Discovery feed: filter by status + category, sort by newest
liveSessionSchema.index({ status: 1, category: 1, startedAt: -1 });

// Discovery feed: trending/popular
liveSessionSchema.index({ status: 1, peakViewerCount: -1 });

// Discovery feed: newest live
liveSessionSchema.index({ status: 1, startedAt: -1 });

// Tag-based discovery
liveSessionSchema.index({ tags: 1, status: 1 });

// Scheduled stream lookup
liveSessionSchema.index(
  { scheduledAt: 1 },
  { partialFilterExpression: { status: 'scheduled' } }
);

// ── Partial Unique Index: One active session per stylist ──
liveSessionSchema.index(
  { stylistId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['live', 'paused'] } },
  }
);

export const LiveSession = model<ILiveSession>('LiveSession', liveSessionSchema);
