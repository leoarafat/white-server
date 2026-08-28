import { Video } from '../app/modules/videos/videos.model';
import { logger } from '../shared/logger';

/**
 * Generates a unique 6-digit videoId.
 *
 * Every creation path must use this. The older `generateArtistId()` kept its
 * "used" set in memory only, never consulted the database, and drew from a
 * 4-digit space that is now ~30% full — which is how 609 records ended up
 * sharing a videoId with another record.
 *
 * Uniqueness here is checked against the database. Once the unique index on
 * `videoId` is in place it becomes the real guarantee and this function is
 * simply the thing that avoids hitting it.
 */
const MIN = 100000;
const RANGE = 900000;
const MAX_ATTEMPTS = 25;

export const generateUniqueVideoId = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const videoId = Math.floor(MIN + Math.random() * RANGE).toString();

    const existing = await Video.exists({ videoId });
    if (!existing) return videoId;

    logger.warn(
      `videoId collision on ${videoId} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`,
    );
  }

  throw new Error(
    `Failed to generate a unique videoId after ${MAX_ATTEMPTS} attempts`,
  );
};
