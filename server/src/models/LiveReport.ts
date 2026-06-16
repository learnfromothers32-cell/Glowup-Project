import { Document, Schema, Types, model } from 'mongoose';

export interface ILiveReport extends Document {
  sessionId: Types.ObjectId;
  messageId?: Types.ObjectId;
  reportedBy: string | Types.ObjectId;
  reason: string;
  details?: string;
  type: 'stream' | 'comment';
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  reviewedBy?: string | Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const liveReportSchema = new Schema<ILiveReport>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'LiveChatMessage' },
    reportedBy: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
    details: { type: String },
    type: { type: String, enum: ['stream', 'comment'], default: 'stream' },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed', 'actioned'], default: 'pending' },
    reviewedBy: { type: Schema.Types.Mixed },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const LiveReport = model<ILiveReport>('LiveReport', liveReportSchema);
