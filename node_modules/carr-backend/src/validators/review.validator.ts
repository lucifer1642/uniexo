import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    serviceType: z.enum(['vehicle', 'house', 'laundry', 'marketplace']),
    serviceId: z.string().min(1),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
  }),
});
