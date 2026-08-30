import { z } from 'zod';
import { objectId } from '../../../shared/zodCommon';

const idParamsSchema = z.object({
  params: z.object({ id: objectId() }),
});

// editMusic (admin) / editVideo (user+sub-user) both patch a Video document
// with a partial payload — stripProtectedVideoFields already blocks
// status/distribution flags server-side, so this only type-checks the
// editable metadata fields from videos.model.ts.
const editVideoBodySchema = z.object({
  title: z.string().trim().min(1).optional(),
  version: z.string().trim().optional(),
  explicit: z.enum(['Yes', 'No']).optional(),
  writer: z.string().trim().optional(),
  composer: z.string().trim().optional(),
  musicDirector: z.string().trim().optional(),
  producer: z.string().trim().optional(),
  editor: z.string().trim().optional(),
  label: z.string().trim().optional(),
  genre: z.string().trim().min(1).optional(),
  subGenre: z.string().trim().optional(),
  language: z.string().trim().optional(),
  upc: z.string().trim().optional(),
  isrc: z.string().trim().optional(),
  audioIsrc: z.string().trim().optional(),
  storeReleaseDate: z.string().trim().optional(),
  releaseDate: z.string().trim().optional(),
  vevoChannel: z.string().trim().optional(),
  repertoireOwner: z.string().trim().min(1).optional(),
  youtubeLink: z.string().trim().optional(),
  time: z.string().trim().optional(),
  visibility: z.string().trim().optional(),
  keywords: z.array(z.string()).optional(),
  videoLink: z.string().trim().optional(),
  assetId: z.string().trim().optional(),
  copyright: z.string().trim().optional(),
  copyrightYear: z.string().trim().optional(),
  territoryPolicy: z.string().trim().optional(),
  isKids: z.enum(['Yes', 'No']).optional(),
  alreadyHaveAnVevoChannel: z.enum(['Yes', 'No']).optional(),
  videoAlreadyExistOnYoutube: z.enum(['Yes', 'No']).optional(),
  youtubePremiere: z.enum(['Yes', 'No']).optional(),
  countdownTheme: z.string().trim().optional(),
  countdownLength: z.string().trim().optional(),
  description: z.string().trim().optional(),
  primaryArtist: z.array(z.any()).optional(),
  featuringArtists: z.array(z.string()).optional(),
});

const editVideoSchema = z.object({
  params: z.object({ id: objectId() }),
  body: editVideoBodySchema,
});

export const CatalogVideoZodSchema = {
  idParamsSchema,
  editVideoSchema,
};
