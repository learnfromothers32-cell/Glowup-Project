import { Document, Schema, Types, model } from 'mongoose';

export interface IClient extends Document {
  stylistId: Types.ObjectId;
  userId: Types.ObjectId;
  totalVisits: number;
  totalSpent: number;
  lastVisit: Date | null;
  favorite: boolean;
  tags: string[];
  notes: string;
  preferences: {
    services: string[];
    notes: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalVisits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastVisit: { type: Date, default: null },
    favorite: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    preferences: {
      services: { type: [String], default: [] },
      notes: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

clientSchema.index({ stylistId: 1, userId: 1 }, { unique: true });

export const Client = model<IClient>('Client', clientSchema);
