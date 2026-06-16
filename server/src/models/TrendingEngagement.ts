import { Document, Schema, Types, model } from 'mongoose';

export interface ITrendingEngagement extends Document {
  transformationId: string;
  stylistId: Types.ObjectId;
  beforeAfterIndex: number;
  likes: number;
  views: number;
  shares: number;
  commentCount: number;
  bookmarks: number;
  score: number;
  updatedAt: Date;
  createdAt: Date;
}

const engagementSchema = new Schema<ITrendingEngagement>(
  {
    transformationId: { type: String, required: true, unique: true, index: true },
    stylistId: { type: Schema.Types.ObjectId, ref: 'Stylist', required: true, index: true },
    beforeAfterIndex: { type: Number, required: true },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TrendingEngagement = model<ITrendingEngagement>('TrendingEngagement', engagementSchema);
