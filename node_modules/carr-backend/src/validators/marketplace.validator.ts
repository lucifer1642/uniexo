import { z } from 'zod';

export const createMarketplaceItemSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().min(10).max(5000),
    category: z.string().min(1),
    price: z.coerce.number().min(0),
    condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
    location: z.string().min(1),
    dynamicFields: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const updateMarketplaceItemSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    category: z.string().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
    location: z.string().min(1).optional(),
    dynamicFields: z.record(z.string(), z.unknown()).optional(),
    isSold: z.boolean().optional(),
  }),
});

export const reportItemSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    reason: z.string().min(5).max(500),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().min(1),
    itemId: z.string().optional(),
    content: z.string().min(1).max(2000),
  }),
});

export const marketplaceQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    category: z.string().optional(),
    condition: z.string().optional(),
    location: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createOfferSchema = z.object({
  body: z.object({
    itemId: z.string().min(1),
    offeredPrice: z.coerce.number().min(0),
    message: z.string().max(2000).optional(),
  }),
});

export const updateOfferStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(['accepted', 'rejected']),
  }),
});
