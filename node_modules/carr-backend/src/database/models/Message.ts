import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  itemId?: Types.ObjectId;
  content: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'MarketplaceItem' },
    content: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ itemId: 1 });
messageSchema.index({ createdAt: -1 });

messageSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
messageSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Message = mongoose.model<IMessage>('Message', messageSchema);
