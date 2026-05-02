import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    type: z.string().min(1),
    brand: z.string().min(1),
    model: z.string().min(1),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
    registrationNumber: z.string().min(1),
    fuelType: z.string().min(1),
    seatingCapacity: z.coerce.number().min(1).max(50),
    pricePerHour: z.coerce.number().min(0).optional(),
    pricePerDay: z.coerce.number().min(0),
    description: z.string().max(2000).optional(),
    features: z.array(z.string()).optional(),
    location: z.string().min(1),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    type: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
    fuelType: z.string().min(1).optional(),
    seatingCapacity: z.coerce.number().min(1).max(50).optional(),
    pricePerHour: z.coerce.number().min(0).optional(),
    pricePerDay: z.coerce.number().min(0).optional(),
    description: z.string().max(2000).optional(),
    features: z.array(z.string()).optional(),
    location: z.string().min(1).optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const vehicleAvailabilitySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    availability: z.array(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    ),
  }),
});

export const vehicleQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    type: z.string().optional(),
    brand: z.string().optional(),
    location: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});
