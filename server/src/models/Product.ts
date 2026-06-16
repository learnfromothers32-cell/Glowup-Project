import { Document, Schema, Types, model } from 'mongoose';

export interface IProduct extends Document {
  stylistId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  category: string;
  images: string[];
  isActive: boolean;
  taxable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
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
    costPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    taxable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productSchema.index({ stylistId: 1, isActive: 1 });
productSchema.index({ stylistId: 1, stock: 1 });

export const Product = model<IProduct>('Product', productSchema);
