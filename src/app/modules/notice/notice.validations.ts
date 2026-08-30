import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const createNoticeSchema = z.object({
  body: z.object({
    title: requiredString('Title'),
    description: requiredString('Description'),
    isActive: z.boolean().optional(),
  }),
});

const updateNoticeSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const NoticeZodSchema = {
  createNoticeSchema,
  updateNoticeSchema,
};
