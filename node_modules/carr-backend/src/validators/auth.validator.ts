import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
    password: z
      .string()
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters'),
    role: z.enum(['user', 'vendor']).optional(),
    // Vendor-specific
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100).optional(),
    serviceType: z.string().min(1, 'Service type is required').optional(),
    // User-specific
    universityId: z.string().optional(),
    location: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.role === 'vendor') {
      if (!data.businessName || data.businessName.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Business name is required for vendors', path: ['businessName'] });
      }
      if (!data.serviceType || data.serviceType.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Service type is required for vendors', path: ['serviceType'] });
      }
    }
    if (data.role === 'user' || !data.role) {
      if (!data.universityId || data.universityId.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'University ID is required', path: ['universityId'] });
      }
      if (!data.location || data.location.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Location is required', path: ['location'] });
      }
    }
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    purpose: z.enum(['signup', 'password-reset', 'email-verify']),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z
      .string()
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters'),
  }),
});

export const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    purpose: z.enum(['signup', 'password-reset', 'email-verify']),
  }),
});
