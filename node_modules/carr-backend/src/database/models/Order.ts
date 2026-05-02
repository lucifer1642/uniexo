import mongoose, { Schema, Document, Types } from 'mongoose';
import { OrderStatus } from '../../types/enums';

export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  laundryServiceId: Types.ObjectId;
  items: {
    serviceName: string;
    quantity: number;
    pricePerUnit: number;
    total: number;
  }[];
  totalAmount: number;
  commissionAmount: number;
  commissionPercent: number;
  status: OrderStatus;
  paymentId?: Types.ObjectId;
  deliveryAddress: string;
  pickupType: 'onsite' | 'store';
  onsitePickupCharge: number;
  pickupDate?: Date;
  deliveryDate?: Date;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    laundryServiceId: { type: Schema.Types.ObjectId, ref: 'LaundryService', required: true },
    items: [
      {
        serviceName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        pricePerUnit: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    commissionPercent: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PLACED,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    deliveryAddress: { type: String, required: true },
    pickupType: { type: String, enum: ['onsite', 'store'], default: 'store' },
    onsitePickupCharge: { type: Number, default: 0, min: 0 },
    pickupDate: { type: Date },
    deliveryDate: { type: Date },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1 });
orderSchema.index({ laundryServiceId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentId: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
orderSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
