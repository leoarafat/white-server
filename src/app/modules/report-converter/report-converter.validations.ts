import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const fieldMappingSchema = z.object({
  type: z.enum(['column', 'constant', 'none'], {
    required_error: 'type is required',
  }),
  header: z.string().trim().optional(),
  value: z.string().trim().optional(),
});

const mappingSchema = z.object({
  source: fieldMappingSchema,
  isrc: fieldMappingSchema,
  title: fieldMappingSchema,
  artist: fieldMappingSchema,
  countryCode: fieldMappingSchema,
  allStreams: fieldMappingSchema,
  perStreamRate: fieldMappingSchema,
  gross: fieldMappingSchema,
});

const convertSchema = z.object({
  body: z.object({
    jobId: requiredString('jobId'),
    mapping: mappingSchema,
  }),
});

const saveTemplateSchema = z.object({
  body: z.object({
    name: requiredString('name'),
    mapping: mappingSchema,
  }),
});

export const ReportConverterZodSchema = {
  convertSchema,
  saveTemplateSchema,
};
