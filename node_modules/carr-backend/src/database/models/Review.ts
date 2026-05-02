import mongoose, { Schema, Document, Types } from 'mongoose';
import { ServiceType } from '../../types/enums';

export interface IReview extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  serviceType: ServiceType;
  serviceId: Types.ObjectId;
  rating: number;
  comment: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, enum: Object.values(ServiceType), required: true },
    serviceId: { type: Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ serviceId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ serviceType: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

reviewSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
reviewSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);
