import { z } from 'zod';

export const createLaundryServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().min(10).max(2000),
    providerName: z.string().min(2),
    providerPhone: z.string().min(10).max(15),
    providerAddress: z.string().min(5),
    services: z.array(
      z.object({
        name: z.string().min(1),
        price: z.coerce.number().min(0),
        unit: z.string().min(1),
      }),
    ).min(1),
  }),
});

export const createLaundryOrderSchema = z.object({
  body: z.object({
    laundryServiceId: z.string().min(1),
    items: z.array(
      z.object({
        serviceName: z.string().min(1),
        quantity: z.coerce.number().min(1),
      }),
    ).min(1),
    deliveryAddress: z.string().min(5),
    pickupDate: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(['processing', 'picked_up', 'in_progress', 'out_for_delivery', 'delivered', 'cancelled']),
  }),
});
