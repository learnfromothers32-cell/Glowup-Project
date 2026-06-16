import { Document, Schema, Types, model } from 'mongoose';

export type QueueEntryStatus = 'waiting' | 'in-service' | 'done' | 'skipped';

export interface IQueueEntry {
  userId: Types.ObjectId;
  position: number;
  joinedAt: Date;
  estimatedServiceMins: number;
  estimatedWaitMins: number;
  status: QueueEntryStatus;
  bookingId?: Types.ObjectId;
}

export interface IQueue extends Document {
  id: string;
  stylistId: Types.ObjectId;
  entries: IQueueEntry[];
  currentPosition: number;
  predictedWaitMins: number;
  avgServiceDuration: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  recalculate: () => void;
}

const queueEntrySchema = new Schema<IQueueEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, required: true },
    joinedAt: { type: Date, default: Date.now },
    estimatedServiceMins: { type: Number, default: 30 },
    estimatedWaitMins: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['waiting', 'in-service', 'done', 'skipped'],
      default: 'waiting'
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' }
  },
  { _id: false }
);

const queueSchema = new Schema<IQueue>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      unique: true,
      index: true
    },
    entries: { type: [queueEntrySchema], default: [] },
    currentPosition: { type: Number, default: 0 },
    predictedWaitMins: { type: Number, default: 0 },
    avgServiceDuration: { type: Number, default: 30 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

queueSchema.methods.recalculate = function () {
  const waiting = this.entries.filter(
    (e: IQueueEntry) => e.status === 'waiting'
  );

  waiting.forEach((entry: IQueueEntry, idx: number) => {
    entry.position = idx + 1;
  });

  this.currentPosition = waiting.length;

  // Compute wait time: sum of estimated service time of all ahead entries
  let totalWait = 0;
  let aheadCount = 0;
  for (const e of this.entries) {
    if (e.status === 'in-service') {
      aheadCount++;
      totalWait += e.estimatedServiceMins;
    }
  }
  const sortedWaiting = [...waiting].sort((a, b) => a.position - b.position);
  for (const e of sortedWaiting) {
    e.estimatedWaitMins = totalWait;
    totalWait += e.estimatedServiceMins;
    aheadCount++;
  }

  this.predictedWaitMins = totalWait;

  this.lastUpdated = new Date();
};

export const Queue = model<IQueue>('Queue', queueSchema);
