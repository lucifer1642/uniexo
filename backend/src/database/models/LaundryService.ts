import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILaundryService extends Document {
  _id: Types.ObjectId;
  vendorId?: Types.ObjectId;
  name: string;
  description: string;
  providerName: string;
  providerPhone: string;
  providerAddress: string;
  services: {
    name: string;
    price: number;
    unit: string;
  }[];
  images: string[];
  rank: number;
  onsitePickup: boolean;
  onStoreService: boolean;
  onsitePickupCharge: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const laundryServiceSchema = new Schema<ILaundryService>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    providerName: { type: String, required: true, trim: true },
    providerPhone: { type: String, required: true, trim: true },
    providerAddress: { type: String, required: true, trim: true },
    services: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true },
      },
    ],
    images: [{ type: String }],
    rank: { type: Number, default: 0 },
    onsitePickup: { type: Boolean, default: false },
    onStoreService: { type: Boolean, default: true },
    onsitePickupCharge: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

laundryServiceSchema.index({ isActive: 1 });
laundryServiceSchema.index({ createdAt: -1 });

laundryServiceSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
laundryServiceSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const LaundryService = mongoose.model<ILaundryService>('LaundryService', laundryServiceSchema);
