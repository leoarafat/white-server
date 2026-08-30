import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const createNewsSchema = z.object({
  body: z.object({
    title: requiredString('Title'),
    description: requiredString('Description'),
  }),
});

export const NewsZodSchema = {
  createNewsSchema,
};
