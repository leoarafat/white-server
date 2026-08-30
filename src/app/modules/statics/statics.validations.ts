import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

// Actual format/parsing of these is normalized server-side
// (normalizeMonthInput in statics.service.ts) — only presence is checked here.
const insertIntoDBSchema = z.object({
  body: z.object({
    reportingMonth: requiredString('reportingMonth'),
    salesMonth: requiredString('salesMonth'),
  }),
});

export const StaticsZodSchema = {
  insertIntoDBSchema,
};
