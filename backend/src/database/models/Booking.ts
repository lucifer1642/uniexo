import mongoose, { Schema, Document, Types } from 'mongoose';
import { BookingStatus, ServiceType } from '../../types/enums';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  vendorId: Types.ObjectId;
  serviceType: ServiceType;
  serviceId: Types.ObjectId;
  bookingType: 'hourly' | 'daily';
  paymentMethod: 'online';
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  commissionAmount: number;
  commissionPercent: number;
  status: BookingStatus;
  paymentId?: Types.ObjectId;
  cancellationReason?: string;
  notes?: string;
  securityDeposit?: number;
  monthlyRent?: number;
  totalMonths?: number;
  idCardUrl?: string;
  installments?: {
    month: number;
    amount: number;
    status: 'pending' | 'paid';
    dueDate: Date;
    paymentId?: Types.ObjectId;
  }[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, enum: Object.values(ServiceType), required: true },
    serviceId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: function (this: IBooking) {
        switch (this.serviceType) {
          case ServiceType.VEHICLE:
            return 'Vehicle';
          case ServiceType.HOUSE:
            return 'House';
          case ServiceType.LAUNDRY:
            return 'LaundryService';
          case ServiceType.MARKETPLACE:
            return 'MarketplaceItem';
          default:
            return 'Vehicle';
        }
      } as any,
    },
    bookingType: { type: String, enum: ['hourly', 'daily'], required: true, default: 'daily' },
    paymentMethod: { type: String, enum: ['online'], required: true, default: 'online' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    commissionPercent: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    cancellationReason: { type: String },
    notes: { type: String },
    securityDeposit: { type: Number, min: 0 },
    monthlyRent: { type: Number, min: 0 },
    totalMonths: { type: Number, min: 1, max: 12 },
    idCardUrl: { type: String },
    installments: [{
      month: { type: Number, required: true },
      amount: { type: Number, required: true },
      status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
      dueDate: { type: Date, required: true },
      paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' }
    }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bookingSchema.index({ userId: 1 });
bookingSchema.index({ vendorId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ serviceType: 1 });
bookingSchema.index({ paymentId: 1 });
bookingSchema.index({ createdAt: -1 });

bookingSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
bookingSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
