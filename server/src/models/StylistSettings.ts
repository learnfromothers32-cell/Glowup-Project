import { Document, Schema, Types, model } from 'mongoose';

export interface IStylistSettings extends Document {
  stylistId: Types.ObjectId;
  notifications: {
    newBooking: boolean;
    cancellationAlert: boolean;
    reviewNotify: boolean;
    marketingEmails: boolean;
    reminderEmails: boolean;
  };
  privacy: {
    showInSearch: boolean;
    showEmailToClients: boolean;
    showPhoneToClients: boolean;
  };
  business: {
    defaultCurrency: string;
    taxRate: number;
    invoicePrefix: string;
    receiptPrefix: string;
    bookingLeadTime: number;
    maxFutureBookings: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const stylistSettingsSchema = new Schema<IStylistSettings>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      unique: true,
      index: true
    },
    notifications: {
      newBooking: { type: Boolean, default: true },
      cancellationAlert: { type: Boolean, default: true },
      reviewNotify: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      reminderEmails: { type: Boolean, default: true }
    },
    privacy: {
      showInSearch: { type: Boolean, default: true },
      showEmailToClients: { type: Boolean, default: false },
      showPhoneToClients: { type: Boolean, default: false }
    },
    business: {
      defaultCurrency: { type: String, default: 'GHS' },
      taxRate: { type: Number, default: 0, min: 0, max: 100 },
      invoicePrefix: { type: String, default: 'INV-' },
      receiptPrefix: { type: String, default: 'RCP-' },
      bookingLeadTime: { type: Number, default: 60, min: 0 },
      maxFutureBookings: { type: Number, default: 60, min: 1 }
    }
  },
  { timestamps: true }
);

export const StylistSettings = model<IStylistSettings>('StylistSettings', stylistSettingsSchema);
