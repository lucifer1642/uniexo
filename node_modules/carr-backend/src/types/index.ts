import { Request } from 'express';
import { Types } from 'mongoose';
import { UserRole } from './enums';

export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface OTPData {
  otp: string;
  email: string;
  purpose: 'signup' | 'password-reset' | 'email-verify';
  userData?: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    businessName?: string;
    serviceType?: string;
    universityId?: string;
    location?: string;
  };
}

export interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PopulatedDoc<T> {
  _id: Types.ObjectId;
  __v?: number;
  toObject(): T;
}
