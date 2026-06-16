import { Document, Schema, Types, model } from 'mongoose';

export interface ITimeSlot {
  start: string;
  end: string;
}

export interface IDaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breaks: ITimeSlot[];
}

export interface IAvailability extends Document {
  stylistId: Types.ObjectId;
  timezone: string;
  schedule: Record<string, IDaySchedule>;
  dateOverrides: {
    date: Date;
    available: boolean;
    start?: string;
    end?: string;
  }[];
  bufferMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const dayScheduleSchema = new Schema<IDaySchedule>(
  {
    enabled: { type: Boolean, default: true },
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    breaks: { type: [{ start: String, end: String }], default: [] }
  },
  { _id: false }
);

const availabilitySchema = new Schema<IAvailability>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      unique: true,
      index: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    schedule: {
      type: Map,
      of: dayScheduleSchema,
      default: () => {
        const days: Record<string, IDaySchedule> = {};
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
          days[day] = {
            enabled: day !== 'sunday',
            start: '09:00',
            end: '17:00',
            breaks: []
          };
        });
        return days;
      }
    },
    dateOverrides: {
      type: [{ date: Date, available: Boolean, start: String, end: String }],
      default: []
    },
    bufferMinutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 120
    }
  },
  { timestamps: true }
);

export const Availability = model<IAvailability>('Availability', availabilitySchema);
