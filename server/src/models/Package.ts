import { Document, Schema, Types, model } from 'mongoose';

export interface IPackageService {
  serviceId: Types.ObjectId;
  sessions: number;
}

export interface IPackage extends Document {
  stylistId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  services: IPackageService[];
  totalSessions: number;
  expiryDays: number;
  isActive: boolean;
  popular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPackagePurchase extends Document {
  packageId: Types.ObjectId;
  stylistId: Types.ObjectId;
  clientId: Types.ObjectId;
  remainingSessions: number;
  totalSessions: number;
  amountPaid: number;
  paymentRef: string;
  expiresAt: Date | null;
  status: 'active' | 'completed' | 'expired' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const packageServiceSchema = new Schema<IPackageService>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    sessions: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const packageSchema = new Schema<IPackage>(
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
    services: {
      type: [packageServiceSchema],
      default: []
    },
    totalSessions: {
      type: Number,
      required: true,
      min: 1
    },
    expiryDays: {
      type: Number,
      default: 90,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true
    },
    popular: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const packagePurchaseSchema = new Schema<IPackagePurchase>(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
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
    remainingSessions: { type: Number, required: true },
    totalSessions: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    paymentRef: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired', 'refunded'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export const Package = model<IPackage>('Package', packageSchema);
export const PackagePurchase = model<IPackagePurchase>('PackagePurchase', packagePurchaseSchema);
