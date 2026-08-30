import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const addPrimaryArtistSchema = z.object({
  body: z.object({
    primaryArtistName: requiredString('Primary Artist Name'),
    primaryArtistAppleId: z.string().trim().optional(),
    primaryArtistFacebookId: z.string().trim().optional(),
    primaryArtistSpotifyId: z.string().trim().optional(),
    primaryArtistInstagramId: z.string().trim().optional(),
  }),
});

const updatePrimaryArtistSchema = z.object({
  body: z.object({
    primaryArtistName: z.string().trim().min(1).optional(),
    primaryArtistAppleId: z.string().trim().optional(),
    primaryArtistFacebookId: z.string().trim().optional(),
    primaryArtistSpotifyId: z.string().trim().optional(),
    primaryArtistInstagramId: z.string().trim().optional(),
  }),
});

export const PrimaryArtistZodSchema = {
  addPrimaryArtistSchema,
  updatePrimaryArtistSchema,
};
