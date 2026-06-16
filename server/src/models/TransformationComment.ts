import { Document, Schema, Types, model } from 'mongoose';

export interface ITransformationComment extends Document {
  transformationId: string;
  stylistId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<ITransformationComment>(
  {
    transformationId: { type: String, required: true, index: true },
    stylistId: { type: Schema.Types.ObjectId, ref: 'Stylist', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

commentSchema.index({ transformationId: -1, createdAt: -1 });

export const TransformationComment = model<ITransformationComment>('TransformationComment', commentSchema);
