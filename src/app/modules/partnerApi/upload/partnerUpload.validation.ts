import { z } from 'zod';

export const startUploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().optional(),
  category: z.enum(['audio', 'video', 'image', 'other']).optional(),
  size: z.coerce.number().positive().optional(),
});

export const signPartsSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  partNumbers: z
    .array(z.coerce.number().int().min(1).max(10000))
    .min(1)
    .max(50),
});

export const completeUploadSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z
    .array(
      z.object({
        partNumber: z.coerce.number().int().min(1),
        eTag: z.string().min(1),
      }),
    )
    .min(1),
});
