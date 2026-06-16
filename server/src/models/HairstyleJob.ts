import { Document, Schema, Types, model } from 'mongoose';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IHairstyleJob extends Document {
  userId: Types.ObjectId;
  originalImage: string;
  hairstyleId?: Types.ObjectId;
  faceShape?: string;
  resultImage?: string;
  videoUrl?: string;
  status: JobStatus;
  error?: string;
  queueJobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const hairstyleJobSchema = new Schema<IHairstyleJob>(
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
    hairstyleId: {
      type: Schema.Types.ObjectId,
      ref: 'Hairstyle'
    },
    faceShape: {
      type: String,
      enum: ['oval', 'round', 'square', 'heart', 'diamond', 'oblong']
    },
    resultImage: {
      type: String
    },
    videoUrl: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    error: {
      type: String
    },
    queueJobId: {
      type: String
    }
  },
  { timestamps: true }
);

hairstyleJobSchema.index({ userId: 1, createdAt: -1 });
hairstyleJobSchema.index({ status: 1, createdAt: -1 });

export const HairstyleJob = model<IHairstyleJob>('HairstyleJob', hairstyleJobSchema);
