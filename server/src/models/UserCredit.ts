import { Document, Schema, Types, model } from 'mongoose';

export type CreditTransactionType = 'purchase' | 'usage' | 'bonus' | 'refund' | 'expiration';

export interface IUserCredit extends Document {
  userId: Types.ObjectId;
  balance: number;
  lifetimeCredits: number;
  transactions: {
    type: CreditTransactionType;
    amount: number;
    description: string;
    reference?: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userCreditSchema = new Schema<IUserCredit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    lifetimeCredits: { type: Number, default: 0 },
    transactions: [{
      type: { type: String, enum: ['purchase', 'usage', 'bonus', 'refund', 'expiration'], required: true },
      amount: { type: Number, required: true },
      description: { type: String, required: true },
      reference: { type: String },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export const UserCredit = model<IUserCredit>('UserCredit', userCreditSchema);
