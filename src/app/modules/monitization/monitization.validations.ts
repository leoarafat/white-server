import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const createMonetizationSchema = z.object({
  body: z.object({
    channelName: requiredString('Channel Name'),
    channelLogo: z.string().trim().optional(),
    viewCount: z.string().trim().optional(),
    subscriberCount: z.string().trim().optional(),
    videoCount: z.string().trim().optional(),
  }),
});

const updateMonetizationSchema = z.object({
  body: z.object({
    channelName: z.string().trim().min(1).optional(),
    channelLogo: z.string().trim().optional(),
    viewCount: z.string().trim().optional(),
    subscriberCount: z.string().trim().optional(),
    videoCount: z.string().trim().optional(),
    monetized: z.boolean().optional(),
    status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
  }),
});

export const MonetizationZodSchema = {
  createMonetizationSchema,
  updateMonetizationSchema,
};
