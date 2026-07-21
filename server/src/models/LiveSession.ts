import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveSession extends Document {
  stylistId: mongoose.Types.ObjectId;
  title: string;
  thumbnail?: string;
  category: string;
  status: 'pending' | 'live' | 'ended';
  viewerCount: number;
  peakViewerCount: number;
  likeCount: number;
  likedUserIds: string[];
  startedAt?: Date;
  endedAt?: Date;
  duration: number;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    thumbnail: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'live', 'ended'],
      default: 'pending',
      index: true,
    },
    viewerCount: {
      type: Number,
      default: 0,
    },
    peakViewerCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    likedUserIds: {
      type: [String],
      default: [],
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

liveSessionSchema.index({ status: 1, createdAt: -1 });
liveSessionSchema.index({ stylistId: 1, status: 1 });

export const LiveSession = mongoose.model<ILiveSession>('LiveSession', liveSessionSchema);
