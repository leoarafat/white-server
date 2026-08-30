import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const createStoreSchema = z.object({
  body: z.object({
    title: requiredString('Title'),
    link: requiredString('Link').url('Link must be a valid URL'),
  }),
});

const updateStoreSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).optional(),
    link: z.string().trim().url('Link must be a valid URL').optional(),
    storeStatus: z.enum(['Delivered', 'Pending', 'Takedown']).optional(),
  }),
});

export const StoreZodSchema = {
  createStoreSchema,
  updateStoreSchema,
};
