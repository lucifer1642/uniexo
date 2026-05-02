import mongoose, { Schema, Document, Types } from 'mongoose';
import { VendorApprovalStatus } from '../../types/enums';

export interface IVendorProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  email?: string;
  serviceType: string;
  description?: string;
  documents: string[];
  approvalStatus: VendorApprovalStatus;
  rejectionReason?: string;
  priority: number;
  rank: number;
  onsitePickup: boolean;
  onStoreService: boolean;
  onsitePickupCharge: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vendorProfileSchema = new Schema<IVendorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    businessAddress: { type: String, trim: true },
    businessPhone: { type: String, trim: true },
    email: { type: String, trim: true },
    serviceType: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    documents: [{ type: String }],
    approvalStatus: {
      type: String,
      enum: Object.values(VendorApprovalStatus),
      default: VendorApprovalStatus.PENDING,
    },
    rejectionReason: { type: String },
    priority: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    onsitePickup: { type: Boolean, default: false },
    onStoreService: { type: Boolean, default: true },
    onsitePickupCharge: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

vendorProfileSchema.index({ approvalStatus: 1 });
vendorProfileSchema.index({ createdAt: -1 });

vendorProfileSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
vendorProfileSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const VendorProfile = mongoose.model<IVendorProfile>('VendorProfile', vendorProfileSchema);
