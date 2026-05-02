import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
    itemId: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    offeredPrice: number;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
    {
        itemId: { type: Schema.Types.ObjectId, ref: 'MarketplaceItem', required: true },
        buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        offeredPrice: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        message: { type: String, trim: true },
    },
    { timestamps: true }
);

offerSchema.index({ itemId: 1 });
offerSchema.index({ buyerId: 1 });
offerSchema.index({ sellerId: 1 });
offerSchema.index({ status: 1 });

export const Offer = mongoose.model<IOffer>('Offer', offerSchema);
