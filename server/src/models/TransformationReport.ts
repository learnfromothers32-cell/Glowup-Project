import { Document, Schema, Types, model } from 'mongoose';

export interface ITransformationReport extends Document {
  transformationId: string;
  stylistId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<ITransformationReport>(
  {
    transformationId: { type: String, required: true, index: true },
    stylistId: { type: Schema.Types.ObjectId, ref: 'Stylist', required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    details: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed', 'actioned'], default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const TransformationReport = model<ITransformationReport>('TransformationReport', reportSchema);
