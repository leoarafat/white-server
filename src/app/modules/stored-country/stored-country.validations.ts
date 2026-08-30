import { z } from 'zod';
import { objectId, requiredString } from '../../../shared/zodCommon';

const countryDetailSchema = z.object({
  countryName: requiredString('countryName'),
  contentId: objectId('contentId'),
  contentType: z.enum(['SingleTrack', 'Album', 'Video']),
});

const addSongInCountrySchema = z.object({
  body: z.object({
    selectedCountryDetails: z.array(countryDetailSchema).default([]),
    removedCountryDetails: z.array(countryDetailSchema).default([]),
  }),
});

const updateCountryForSongSchema = z.object({
  body: z.object({
    countryName: z.string().trim().min(1).optional(),
    contentId: objectId('contentId').optional(),
    contentType: z.enum(['SingleTrack', 'Album', 'Video']).optional(),
  }),
});

export const CountryZodSchema = {
  addSongInCountrySchema,
  updateCountryForSongSchema,
};
