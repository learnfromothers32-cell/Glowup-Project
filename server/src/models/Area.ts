import { Document, Schema, model } from 'mongoose';

export interface IArea extends Document {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tag: string;
  city: string;
  region: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const areaSchema = new Schema<IArea>(
  {
    name: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    tag: { type: String, default: '' },
    city: { type: String, default: 'Accra', index: true },
    region: { type: String, default: 'Greater Accra' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

areaSchema.index({ city: 1, active: 1, order: 1 });

export const Area = model<IArea>('Area', areaSchema);
