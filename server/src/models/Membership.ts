import { Document, Schema, Types, model } from 'mongoose';

export interface IMembershipTier extends Document {
  stylistId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  benefits: string[];
  discountPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMemberSubscription extends Document {
  tierId: Types.ObjectId;
  stylistId: Types.ObjectId;
  clientId: Types.ObjectId;
  startDate: Date;
  nextBillingDate: Date;
  cancelledAt: Date | null;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  paymentMethod: string;
  paymentRef: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const membershipTierSchema = new Schema<IMembershipTier>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    billingCycle: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    benefits: {
      type: [String],
      default: []
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const memberSubscriptionSchema = new Schema<IMemberSubscription>(
  {
    tierId: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipTier',
      required: true
    },
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    startDate: { type: Date, default: Date.now },
    nextBillingDate: { type: Date, required: true },
    cancelledAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'past_due'],
      default: 'active'
    },
    paymentMethod: { type: String, default: '' },
    paymentRef: { type: String, default: '' },
    autoRenew: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const MembershipTier = model<IMembershipTier>('MembershipTier', membershipTierSchema);
export const MemberSubscription = model<IMemberSubscription>('MemberSubscription', memberSubscriptionSchema);
