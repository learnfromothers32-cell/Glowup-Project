import { Document, Schema, Types, model } from 'mongoose';

export type GuestRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface ILiveGuestRequest extends Document {
  id: string;
  sessionId: Types.ObjectId;
  viewerId: Types.ObjectId;
  displayName: string;
  status: GuestRequestStatus;
  reason?: string;
  respondedBy?: Types.ObjectId;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const liveGuestRequestSchema = new Schema<ILiveGuestRequest>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    viewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes
liveGuestRequestSchema.index({ sessionId: 1, status: 1 });
liveGuestRequestSchema.index({ sessionId: 1, viewerId: 1 }, { unique: true });
liveGuestRequestSchema.index({ sessionId: 1, createdAt: -1 });

export const LiveGuestRequest = model<ILiveGuestRequest>(
  'LiveGuestRequest',
  liveGuestRequestSchema
);
