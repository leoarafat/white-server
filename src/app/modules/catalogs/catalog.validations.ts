import { z } from 'zod';
import { objectId, requiredString } from '../../../shared/zodCommon';

const idParamsSchema = z.object({
  params: z.object({ id: objectId() }),
});

// editMusic/editMusicForAdmin patch whichever of SingleTrack/Video the id
// belongs to with an arbitrary partial payload (the upload stepper is reused
// for editing), so every field here mirrors single.model.ts / videos.model.ts
// and is optional. primaryArtist arrives in one of several shapes (plain
// name strings, {value}, or {_id} objects) that the service normalizes
// itself, so it's only checked to be an array here.
const editReleaseBodySchema = z.object({
  releaseTitle: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  subtitle: z.string().trim().optional(),
  pLine: z.string().trim().min(1).optional(),
  cLine: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  composer: z.string().trim().min(1).optional(),
  arranger: z.string().trim().optional(),
  producer: z.string().trim().optional(),
  remixer: z.string().trim().optional(),
  actor: z.string().trim().optional(),
  filmDirector: z.string().trim().optional(),
  genre: z.string().trim().min(1).optional(),
  subGenre: z.string().trim().optional(),
  upc: z.string().trim().optional(),
  producerCatalogNumber: z.string().trim().optional(),
  productionYear: z.string().trim().optional(),
  label: z.string().trim().min(1).optional(),
  publisher: z.string().trim().optional(),
  isrc: z.string().trim().optional(),
  catalogNumber: z.string().trim().optional(),
  trackTitleLanguage: z.string().trim().optional(),
  lyricsLanguage: z.string().trim().optional(),
  releaseDate: z.string().trim().optional(),
  advancePurchaseDate: z.string().trim().optional(),
  lyrics: z.string().trim().optional(),
  platform: z.string().trim().optional(),
  mood: z.string().trim().optional(),
  price: z.string().trim().optional(),
  crbtTime: z.string().trim().optional(),
  crbtTitle: z.string().trim().optional(),
  previewStart: z.string().trim().optional(),
  primaryTrackType: z.enum(['Music', 'Classic Music', 'Jazz Music']).optional(),
  isRelease: z.enum(['Yes', 'No']).optional(),
  instrumental: z.enum(['Yes', 'No']).optional(),
  secondaryTrackType: z
    .enum(['Original', 'Karaoke', 'Medley', 'Cover', 'Cover by cover band'])
    .optional(),
  parentalAdvisory: z.enum(['Explicit', 'Not Explicit']).optional(),
  contentType: z.enum(['Album', 'Single', 'Compilation', 'Remix']).optional(),
  format: z.enum(['Single', 'Album', 'EP']).optional(),
  primaryArtist: z.array(z.any()).optional(),
  musicDirector: z.array(z.string()).optional(),
  featuringArtists: z.array(z.string()).optional(),
});

const editReleaseSchema = z.object({
  params: z.object({ id: objectId() }),
  body: editReleaseBodySchema,
});

const correctionSongSchema = z.object({
  params: z.object({ id: objectId() }),
  body: z.object({
    user: objectId('user'),
    title: requiredString('title'),
    message: requiredString('message'),
  }),
});

export const CatalogMusicZodSchema = {
  idParamsSchema,
  editReleaseSchema,
  correctionSongSchema,
};
