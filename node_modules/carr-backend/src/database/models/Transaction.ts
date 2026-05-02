import mongoose, { Schema, Document, Types } from 'mongoose';
import { TransactionType, ServiceType } from '../../types/enums';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: Types.ObjectId;
  serviceType?: ServiceType;
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    serviceType: { type: String, enum: Object.values(ServiceType) },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true },
);

transactionSchema.index({ walletId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
