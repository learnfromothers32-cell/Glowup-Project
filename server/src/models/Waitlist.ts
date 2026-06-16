import { Document, Schema, Types, model } from 'mongoose';

export interface IWaitlistEntry extends Document {
  stylistId: Types.ObjectId;
  clientId: Types.ObjectId;
  serviceId: Types.ObjectId;
  preferredDate: Date;
  preferredTime: string;
  notified: boolean;
  notifiedAt: Date | null;
  status: 'waiting' | 'notified' | 'booked' | 'expired' | 'cancelled';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConsultationForm extends Document {
  stylistId: Types.ObjectId;
  name: string;
  description: string;
  questions: {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConsultationResponse extends Document {
  formId: Types.ObjectId;
  stylistId: Types.ObjectId;
  clientId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  answers: { questionId: string; value: any }[];
  createdAt: Date;
}

const waitlistSchema = new Schema<IWaitlistEntry>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, default: '' },
    notified: { type: Boolean, default: false },
    notifiedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['waiting', 'notified', 'booked', 'expired', 'cancelled'],
      default: 'waiting'
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

waitlistSchema.index({ stylistId: 1, status: 1 });

const questionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'select', 'checkbox', 'radio', 'file'],
      required: true
    },
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    placeholder: { type: String, default: '' }
  },
  { _id: false }
);

const formSchema = new Schema<IConsultationForm>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    questions: { type: [questionSchema], default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const responseSchema = new Schema<IConsultationResponse>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'ConsultationForm',
      required: true
    },
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    answers: {
      type: [{ questionId: String, value: Schema.Types.Mixed }],
      default: []
    }
  },
  { timestamps: true }
);

export const WaitlistEntry = model<IWaitlistEntry>('WaitlistEntry', waitlistSchema);
export const ConsultationForm = model<IConsultationForm>('ConsultationForm', formSchema);
export const ConsultationResponse = model<IConsultationResponse>('ConsultationResponse', responseSchema);
