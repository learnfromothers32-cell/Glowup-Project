import { Document, Schema, model } from 'mongoose';

export interface ICreditPackage extends Document {
  name: string;
  credits: number;
  price: number;
  currency: string;
  popular: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const creditPackageSchema = new Schema<ICreditPackage>(
  {
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const CreditPackage = model<ICreditPackage>('CreditPackage', creditPackageSchema);
