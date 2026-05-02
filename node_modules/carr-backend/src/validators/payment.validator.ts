import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    serviceType: z.enum(['vehicle', 'house', 'laundry', 'marketplace']),
    referenceId: z.string().min(1),
    amount: z.coerce.number().min(1),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  }),
});
