import { z } from 'zod';
import { objectId } from '../../../shared/zodCommon';

const markAsReadSchema = z.object({
  params: z.object({
    id: objectId(),
  }),
});

export const NotificationZodSchema = {
  markAsReadSchema,
};
