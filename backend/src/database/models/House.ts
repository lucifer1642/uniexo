import mongoose, { Schema, Document, Types } from 'mongoose';
import { ListingApprovalStatus } from '../../types/enums';

export interface IHouse extends Document {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;
  title: string;
  description: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  pricePerMonth?: number; // For PG
  pricePerDay?: number; // For Room
  pricePerHour?: number; // For Room/Hourly
  singleSharingPrice?: number; // For PG
  doubleSharingPrice?: number; // For PG
  tripleSharingPrice?: number; // For PG
  securityDeposit?: number; // For PG
  lockinPeriod?: string; // e.g., "0 months"
  noticePeriod?: string; // e.g., "30 days"
  electricityIncluded?: boolean; // For PG
  electricityCharge?: number; // For PG
  images: string[];
  amenities: string[]; // General or legacy
  commonAmenities: string[];
  roomAmenities: string[];
  servicesAmenities: string[];
  foodAmenities: string[];
  rules: string[];
  faqs?: { question: string; answer: string }[];
  locationUrl?: string; // Optional embedded map or location link
  tenantsStaying?: number; // Approximate count of currently reserved beds
  approvalStatus: ListingApprovalStatus;
  rejectionReason?: string;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const houseSchema = new Schema<IHouse>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    propertyType: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    area: { type: Number, required: true },
    pricePerMonth: { type: Number, min: 0 },
    pricePerDay: { type: Number, min: 0 },
    pricePerHour: { type: Number, min: 0 },
    singleSharingPrice: { type: Number, min: 0 },
    doubleSharingPrice: { type: Number, min: 0 },
    tripleSharingPrice: { type: Number, min: 0 },
    securityDeposit: { type: Number, min: 0 },
    lockinPeriod: { type: String, default: '0 months' },
    noticePeriod: { type: String, default: '15 days' },
    electricityIncluded: { type: Boolean, default: true },
    electricityCharge: { type: Number, min: 0, default: 0 },
    images: [{ type: String }],
    amenities: [{ type: String }],
    commonAmenities: [{ type: String }],
    roomAmenities: [{ type: String }],
    servicesAmenities: [{ type: String }],
    foodAmenities: [{ type: String }],
    rules: [{ type: String }],
    faqs: [{
      question: { type: String, required: true },
      answer: { type: String, required: true }
    }],
    locationUrl: { type: String },
    tenantsStaying: { type: Number, default: 0 },
    approvalStatus: {
      type: String,
      enum: Object.values(ListingApprovalStatus),
      default: ListingApprovalStatus.PENDING,
    },
    rejectionReason: { type: String },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

houseSchema.index({ vendorId: 1 });
houseSchema.index({ city: 1, state: 1 });
houseSchema.index({ pricePerMonth: 1 });
houseSchema.index({ approvalStatus: 1 });
houseSchema.index({ createdAt: -1 });

houseSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
houseSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const House = mongoose.model<IHouse>('House', houseSchema);
