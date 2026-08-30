import { z } from 'zod';
import { objectId } from '../../../shared/zodCommon';

const storedSongSchema = z.object({
  storeId: objectId('storeId'),
  contentId: objectId('contentId'),
  contentType: z.enum(['SingleTrack', 'Album', 'Video']),
  storeStatus: z.enum(['Delivered', 'Takedown', 'Pending']),
});

// Body is a bulk array of rows (each upserted individually), not a single object.
const addSongInStoreSchema = z.object({
  body: z.array(storedSongSchema).min(1, 'At least one entry is required'),
});

const updateStoreForSongSchema = z.object({
  body: z.object({
    contentType: z.enum(['SingleTrack', 'Album', 'Video']).optional(),
    storeStatus: z.enum(['Delivered', 'Takedown', 'Pending']).optional(),
  }),
});

export const StoredSongsZodSchema = {
  addSongInStoreSchema,
  updateStoreForSongSchema,
};
