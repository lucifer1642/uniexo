import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../../types/enums';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  avatar?: string;
  location?: string;
  idCardPhotoUrl?: string;
  universityId?: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'none';
  refreshToken?: string;
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    refreshToken: { type: String, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    isEmailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    avatar: { type: String },
    location: { type: String, trim: true },
    idCardPhotoUrl: { type: String },
    universityId: { type: String, trim: true },
    kycStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'none'], 
      default: 'none' 
    },
    bankDetails: {
      accountHolder: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isDeleted: 1 });

userSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
userSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const User = mongoose.model<IUser>('User', userSchema);
