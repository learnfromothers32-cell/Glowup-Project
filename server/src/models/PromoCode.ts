import { Document, Schema, Types, model } from 'mongoose';

export interface IPromoCode extends Document {
  stylistId: Types.ObjectId;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBookingValue: number;
  maxUses: number;
  currentUses: number;
  maxUsesPerClient: number;
  applicableServices: Types.ObjectId[];
  startsAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGiftCard extends Document {
  stylistId: Types.ObjectId;
  code: string;
  initialBalance: number;
  remainingBalance: number;
  senderName: string;
  recipientEmail: string;
  message: string;
  purchasedBy: Types.ObjectId;
  claimedBy: Types.ObjectId | null;
  expiresAt: Date | null;
  status: 'active' | 'partial' | 'redeemed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const promoSchema = new Schema<IPromoCode>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    description: { type: String, default: '', trim: true },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: { type: Number, required: true, min: 0 },
    minBookingValue: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    currentUses: { type: Number, default: 0 },
    maxUsesPerClient: { type: Number, default: 1 },
    applicableServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

promoSchema.index({ stylistId: 1, code: 1 }, { unique: true });

const giftCardSchema = new Schema<IGiftCard>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true
    },
    initialBalance: { type: Number, required: true, min: 0 },
    remainingBalance: { type: Number, required: true, min: 0 },
    senderName: { type: String, default: '', trim: true },
    recipientEmail: { type: String, default: '', trim: true },
    message: { type: String, default: '', trim: true },
    purchasedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    claimedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'partial', 'redeemed', 'expired'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export const PromoCode = model<IPromoCode>('PromoCode', promoSchema);
export const GiftCard = model<IGiftCard>('GiftCard', giftCardSchema);
