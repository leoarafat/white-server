import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const addFaqSchema = z.object({
  body: z.object({
    question: requiredString('Question'),
    answer: requiredString('Answer'),
  }),
});

const updateFaqSchema = z.object({
  body: z.object({
    question: z.string().trim().min(1).optional(),
    answer: z.string().trim().min(1).optional(),
  }),
});

export const FaqZodSchema = {
  addFaqSchema,
  updateFaqSchema,
};
