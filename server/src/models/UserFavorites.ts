import { Document, Schema, Types, model } from 'mongoose';

export interface IUserFavorites extends Document {
  id: string;
  userId: Types.ObjectId;
  hairstyleResultId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userFavoritesSchema = new Schema<IUserFavorites>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    hairstyleResultId: {
      type: Schema.Types.ObjectId,
      ref: 'UserHairstyleResult',
      required: true
    }
  },
  { timestamps: true }
);

userFavoritesSchema.index({ userId: 1, createdAt: -1 });
userFavoritesSchema.index({ userId: 1, hairstyleResultId: 1 }, { unique: true });

export const UserFavorites = model<IUserFavorites>('UserFavorites', userFavoritesSchema);
