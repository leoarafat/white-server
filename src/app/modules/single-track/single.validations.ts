import { z } from 'zod';

// Server-side guard for the single-track upload (POST /single-music/upload).
// The client sends a flat multipart form (all values are strings) plus the
// `audio` and `image` files. This mirrors the required fields the upload UI
// enforces, so a malformed request is rejected before any DB/S3 work runs.
const req = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`);

// Files now arrive pre-uploaded (via POST /single-music/upload-asset, called
// the instant the user picks each file) — the final submit is a plain JSON
// body carrying `audio`/`image` as URL strings, not multipart. `files` is
// left optional here only for the legacy multipart path some older callers
// (e.g. /edit-audio draft resubmission) may still use.
// The live form now sends primaryArtist as a real JSON array (previously a
// comma-joined string over multipart) — accept either shape, same as the
// service layer's resolveArtistNames() already does.
const primaryArtistField = z
  .union([z.string(), z.array(z.string())], {
    required_error: 'Primary Artist is required',
  })
  .refine(
    v => (Array.isArray(v) ? v.length > 0 : v.trim().length > 0),
    'Primary Artist is required',
  );

const uploadSingleSchema = z.object({
  body: z.object({
    releaseTitle: req('Release Title'),
    primaryArtist: primaryArtistField,
    genre: req('Genre'),
    // Secondary Genre is optional in the wizard (matches ptune's own
    // "Enter Release Details" step, where only Primary Genre is required).
    subGenre: z.string().trim().optional(),
    format: req('Format'),
    releaseDate: req('Release Date'),
    productionYear: req('Production Year'),
    primaryTrackType: req('Primary Track Type'),
    title: req('Track Title'),
    parentalAdvisory: req('Parental Advisory'),
    trackTitleLanguage: req('Track Title Language'),
    lyricsLanguage: req('Lyrics Language'),
    instrumental: req('Instrumental'),
    audio: z.string().trim().optional(),
    image: z.string().trim().optional(),
  }),
  files: z
    .object({
      audio: z.array(z.any()).optional(),
      image: z.array(z.any()).optional(),
    })
    .optional(),
});

// PATCH /single-music/update/:id — a loose partial edit of the track,
// mirroring single.model.ts. primaryArtist/label/featuringArtists arrive as
// names/ids that the service resolves itself, so they're only checked for
// shape here.
const updateSingleMusicSchema = z.object({
  body: z.object({
    releaseTitle: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    subtitle: z.string().trim().optional(),
    pLine: z.string().trim().min(1).optional(),
    cLine: z.string().trim().min(1).optional(),
    writer: z.string().trim().optional(),
    author: z.string().trim().min(1).optional(),
    composer: z.string().trim().min(1).optional(),
    arranger: z.string().trim().optional(),
    producer: z.string().trim().optional(),
    genre: z.string().trim().min(1).optional(),
    subGenre: z.string().trim().optional(),
    productionYear: z.string().trim().optional(),
    trackTitleLanguage: z.string().trim().optional(),
    lyricsLanguage: z.string().trim().optional(),
    releaseDate: z.string().trim().optional(),
    lyrics: z.string().trim().optional(),
    format: z.enum(['Single', 'Album', 'EP']).optional(),
    parentalAdvisory: z.enum(['Explicit', 'Not Explicit']).optional(),
    instrumental: z.enum(['Yes', 'No']).optional(),
    primaryArtist: z.union([z.string(), z.array(z.any())]).optional(),
    label: z.string().trim().optional(),
    musicDirector: z.array(z.string()).optional(),
    featuringArtists: z.union([z.string(), z.array(z.any())]).optional(),
  }),
});

export const SingleTrackZodSchema = {
  uploadSingleSchema,
  updateSingleMusicSchema,
};
