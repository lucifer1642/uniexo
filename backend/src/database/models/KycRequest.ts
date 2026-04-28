import mongoose, { Schema, Document, Types } from 'mongoose';

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface IKycRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  documents: {
    type: string;
    url: string;
  }[];
  status: KycStatus;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const kycRequestSchema = new Schema<IKycRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bankDetails: {
      accountHolder: { type: String, required: true, trim: true },
      accountNumber: { type: String, required: true, trim: true },
      ifscCode: { type: String, required: true, trim: true },
      bankName: { type: String, required: true, trim: true },
    },
    documents: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
      }
    ],
    status: {
      type: String,
      enum: Object.values(KycStatus),
      default: KycStatus.PENDING,
    },
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

kycRequestSchema.index({ status: 1 });
kycRequestSchema.index({ userId: 1 });

export const KycRequest = mongoose.model<IKycRequest>('KycRequest', kycRequestSchema);
