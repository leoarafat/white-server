import { z } from 'zod';
import { objectId } from '../../../shared/zodCommon';

const typeIdParams = z.object({
  type: z.enum(['audio', 'video'], {
    required_error: 'type is required',
    invalid_type_error: 'type must be "audio" or "video"',
  }),
  id: objectId(),
});

const approveSchema = z.object({
  params: typeIdParams,
});

const rejectSchema = z.object({
  params: typeIdParams,
  body: z.object({
    reason: z.string().trim().optional(),
  }),
});

export const MasterReviewZodSchema = {
  approveSchema,
  rejectSchema,
};
