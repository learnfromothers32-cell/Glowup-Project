import { Document, Schema, Types, model } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: 'client' | 'stylist';
  content: string;
  attachments: string[];
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  stylistId: Types.ObjectId;
  clientId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  subject?: string;
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
  unreadStylist: number;
  unreadClient: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['client', 'stylist'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    attachments: {
      type: [String],
      default: []
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const conversationSchema = new Schema<IConversation>(
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
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    subject: {
      type: String,
      trim: true
    },
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date
    },
    unreadStylist: { type: Number, default: 0 },
    unreadClient: { type: Number, default: 0 },
    archived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

conversationSchema.index({ stylistId: 1, clientId: 1 }, { unique: true });

export const Message = model<IMessage>('Message', messageSchema);
export const Conversation = model<IConversation>('Conversation', conversationSchema);
