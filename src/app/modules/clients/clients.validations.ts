import { z } from 'zod';
import { objectId, requiredString } from '../../../shared/zodCommon';

const approveOrRejectSchema = z.object({
  body: z.object({
    userId: objectId('userId'),
    approveStatus: z.enum(['pending', 'approved', 'rejected'], {
      required_error: 'approveStatus is required',
    }),
  }),
});

const addRevenuePercentSchema = z.object({
  body: z.object({
    userId: objectId('userId'),
    revenueRate: requiredString('revenueRate'),
  }),
});

const lockUnlockUserSchema = z.object({
  body: z.object({
    userId: objectId('userId'),
  }),
});

export const ClientZodSchema = {
  approveOrRejectSchema,
  addRevenuePercentSchema,
  lockUnlockUserSchema,
};
