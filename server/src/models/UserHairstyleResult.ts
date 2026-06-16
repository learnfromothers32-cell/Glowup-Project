import { Document, Schema, Types, model } from 'mongoose';

export interface IUserHairstyleResult extends Document {
  id: string;
  userId: Types.ObjectId;
  originalImage: string;
  generatedImage?: string;
  hairstyleId: Types.ObjectId;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userHairstyleResultSchema = new Schema<IUserHairstyleResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalImage: {
      type: String,
      required: true
    },
    generatedImage: {
      type: String
    },
    hairstyleId: {
      type: Schema.Types.ObjectId,
      ref: 'Hairstyle',
      required: true
    },
    favorite: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

userHairstyleResultSchema.index({ userId: 1, createdAt: -1 });
userHairstyleResultSchema.index({ userId: 1, hairstyleId: 1 });
userHairstyleResultSchema.index({ favorite: 1, userId: 1 });

export const UserHairstyleResult = model<IUserHairstyleResult>('UserHairstyleResult', userHairstyleResultSchema);
