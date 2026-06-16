import { Document, Schema, model } from 'mongoose';

export interface IHairstyle extends Document {
  id: string;
  name: string;
  slug: string;
  category: 'men' | 'women' | 'unisex';
  gender?: 'male' | 'female';
  previewImage: string;
  templateImage?: string;
  prompt?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hairstyleSchema = new Schema<IHairstyle>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      required: true,
      index: true
    },
    gender: {
      type: String,
      enum: ['male', 'female']
    },
    previewImage: {
      type: String,
      required: true
    },
    templateImage: {
      type: String
    },
    prompt: {
      type: String
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

hairstyleSchema.index({ slug: 1 });
hairstyleSchema.index({ category: 1, active: 1 });

export const Hairstyle = model<IHairstyle>('Hairstyle', hairstyleSchema);
