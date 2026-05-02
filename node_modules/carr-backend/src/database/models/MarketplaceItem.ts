import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMarketplaceItem extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: string;
  images: string[];
  dynamicFields: Map<string, unknown>;
  location: string;
  isSold: boolean;
  isReported: boolean;
  reportCount: number;
  reportReasons: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceItemSchema = new Schema<IMarketplaceItem>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    condition: { type: String, required: true, trim: true },
    images: [{ type: String }],
    dynamicFields: { type: Map, of: Schema.Types.Mixed, default: {} },
    location: { type: String, required: true, trim: true },
    isSold: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    reportReasons: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

marketplaceItemSchema.index({ sellerId: 1 });
marketplaceItemSchema.index({ category: 1 });
marketplaceItemSchema.index({ price: 1 });
marketplaceItemSchema.index({ createdAt: -1 });
marketplaceItemSchema.index({ isSold: 1 });
marketplaceItemSchema.index({ title: 'text', description: 'text' });

marketplaceItemSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
marketplaceItemSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const MarketplaceItem = mongoose.model<IMarketplaceItem>('MarketplaceItem', marketplaceItemSchema);
