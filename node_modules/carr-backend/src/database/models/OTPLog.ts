import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOTPLog extends Document {
  _id: Types.ObjectId;
  email: string;
  otp: string;
  purpose: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpLogSchema = new Schema<IOTPLog>(
  {
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    purpose: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

otpLogSchema.index({ email: 1, purpose: 1 });

export const OTPLog = mongoose.model<IOTPLog>('OTPLog', otpLogSchema);
