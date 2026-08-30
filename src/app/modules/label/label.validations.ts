import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const addLabelSchema = z.object({
  body: z.object({
    labelName: requiredString('Label Name'),
    youtubeChannel: z.string().trim().optional(),
    youtubeUrl: z.string().trim().optional(),
  }),
});

const updateMyLabelSchema = z.object({
  body: z.object({
    labelName: z.string().trim().min(1).optional(),
    youtubeChannel: z.string().trim().optional(),
    youtubeUrl: z.string().trim().optional(),
  }),
});

// Admin edit — can also move a label between approval states.
const updateLabelSchema = z.object({
  body: z.object({
    labelName: z.string().trim().min(1).optional(),
    youtubeChannel: z.string().trim().optional(),
    youtubeUrl: z.string().trim().optional(),
    avatar: z.string().trim().optional(),
    banner: z.string().trim().optional(),
    approvedStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const LabelZodSchema = {
  addLabelSchema,
  updateMyLabelSchema,
  updateLabelSchema,
};
