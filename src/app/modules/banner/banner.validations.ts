import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const createBannerSchema = z.object({
  body: z.object({
    title: requiredString('Title'),
    description: requiredString('Description'),
  }),
});

export const BannerZodSchema = {
  createBannerSchema,
};
