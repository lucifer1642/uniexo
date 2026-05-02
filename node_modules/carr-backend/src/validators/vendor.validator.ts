import { z } from 'zod';

export const vendorRegistrationSchema = z.object({
  body: z.object({
    businessName: z.string().min(2, 'Business name is required').max(100),
    businessAddress: z.string().min(5, 'Business address is required'),
    businessPhone: z.string().min(10).max(15),
    description: z.string().max(1000).optional(),
  }),
});

export const vendorApprovalSchema = z.object({
  params: z.object({
    vendorId: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    reason: z.string().optional(),
  }),
});

export const updateVendorProfileSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).max(100).optional(),
    businessAddress: z.string().min(5).optional(),
    businessPhone: z.string().min(10).max(15).optional(),
    description: z.string().max(1000).optional(),
    serviceType: z.string().optional(),
  }),
});
