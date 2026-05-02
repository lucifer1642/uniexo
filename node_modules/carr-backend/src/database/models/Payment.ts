import mongoose, { Schema, Document, Types } from 'mongoose';
import { PaymentStatus, ServiceType } from '../../types/enums';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  serviceType: ServiceType;
  referenceId: Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  receipt: string;
  notes?: Record<string, string>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, enum: Object.values(ServiceType), required: true },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.CREATED,
    },
    receipt: { type: String, required: true },
    notes: { type: Map, of: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ referenceId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
