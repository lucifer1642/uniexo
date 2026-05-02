import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    serviceType: z.enum(['vehicle', 'house']),
    serviceId: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(['confirmed', 'cancelled', 'completed']),
    cancellationReason: z.string().optional(),
  }),
});

export const bookingQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
    serviceType: z.enum(['vehicle', 'house']).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});
