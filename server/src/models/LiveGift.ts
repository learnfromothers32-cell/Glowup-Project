import { Document, Schema, Types, model } from 'mongoose';

export interface IGiftTransaction extends Document {
  sessionId: Types.ObjectId;
  fromUserId: string | Types.ObjectId;
  fromUserName: string;
  toStylistId: Types.ObjectId;
  giftId: string;
  giftName: string;
  giftIcon: string;
  coinAmount: number;
  animation: 'small' | 'medium' | 'large';
  createdAt: Date;
}

const giftTransactionSchema = new Schema<IGiftTransaction>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true, index: true },
    fromUserId: { type: Schema.Types.Mixed, required: true },
    fromUserName: { type: String, default: 'Anonymous' },
    toStylistId: { type: Schema.Types.ObjectId, ref: 'Stylist', required: true },
    giftId: { type: String, required: true },
    giftName: { type: String, required: true },
    giftIcon: { type: String, required: true },
    coinAmount: { type: Number, required: true },
    animation: { type: String, enum: ['small', 'medium', 'large'], default: 'small' },
  },
  { timestamps: true }
);

giftTransactionSchema.index({ sessionId: 1, createdAt: -1 });
giftTransactionSchema.index({ toStylistId: 1, createdAt: -1 });

export const GiftTransaction = model<IGiftTransaction>('GiftTransaction', giftTransactionSchema);
