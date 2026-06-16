import { Document, Schema, Types, model } from 'mongoose';

export interface IUserEngagement extends Document {
  userId: Types.ObjectId;
  transformationId: string;
  type: 'like' | 'bookmark';
  createdAt: Date;
}

const engagementSchema = new Schema<IUserEngagement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transformationId: { type: String, required: true },
    type: { type: String, enum: ['like', 'bookmark'], required: true },
  },
  { timestamps: true }
);

engagementSchema.index({ userId: 1, transformationId: 1, type: 1 }, { unique: true });

export const UserEngagement = model<IUserEngagement>('UserEngagement', engagementSchema);
