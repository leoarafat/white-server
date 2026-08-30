import { z } from 'zod';
import { objectId } from '../../../shared/zodCommon';

const recognizeParamsSchema = z.object({
  params: z.object({
    id: objectId(),
  }),
});

export const AcrZodSchema = {
  recognizeParamsSchema,
};
