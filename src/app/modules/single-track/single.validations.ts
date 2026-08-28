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

const uploadSingleSchema = z.object({
  body: z.object({
    releaseTitle: req('Release Title'),
    primaryArtist: req('Primary Artist'),
    genre: req('Genre'),
    subGenre: req('Sub Genre'),
    label: req('Label'),
    format: req('Format'),
    releaseDate: req('Release Date'),
    productionYear: req('Production Year'),
    pLine: req('P Line'),
    cLine: req('C Line'),
    primaryTrackType: req('Primary Track Type'),
    title: req('Track Title'),
    author: req('Author'),
    composer: req('Composer'),
    parentalAdvisory: req('Parental Advisory'),
    trackTitleLanguage: req('Track Title Language'),
    lyricsLanguage: req('Lyrics Language'),
    instrumental: req('Instrumental'),
  }),
  files: z.object(
    {
      audio: z
        .array(z.any())
        .nonempty({ message: 'Audio Track file is required' }),
      image: z
        .array(z.any())
        .nonempty({ message: 'Cover Artwork file is required' }),
    },
    { required_error: 'Audio Track and Cover Artwork files are required' },
  ),
});

export const SingleTrackZodSchema = {
  uploadSingleSchema,
};
