import { z } from 'zod';
import { objectId } from '../../../shared/zodCommon';

// Server-side guard for the video upload (POST /video/upload). The stepper
// client sends a JSON body whose asset URLs live in `videoUrl` / `thumbnailUrl`
// and whose title/owner use `videoTitle` / `reportingOwner`; a legacy form used
// `video` / `image` / `title`. Accept either naming so the guard never rejects
// a valid request, while still catching genuinely incomplete submissions before
// any DB work runs.
const req = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`);

const uploadVideoSchema = z.object({
  body: z
    .object({
      videoTitle: z.string().trim().optional(),
      title: z.string().trim().optional(),
      videoUrl: z.string().trim().optional(),
      video: z.string().trim().optional(),
      thumbnailUrl: z.string().trim().optional(),
      image: z.string().trim().optional(),
      genre: req('Genre'),
      label: req('Label'),
      vevoChannel: req('VEVO Channel'),
      copyrightYear: req('Copyright Year'),
      primaryArtists: z.array(z.string()).optional(),
      primaryArtist: z
        .union([z.string(), z.array(z.string())])
        .optional(),
    })
    .refine(b => Boolean(b.videoTitle?.trim() || b.title?.trim()), {
      message: 'Video Title is required',
      path: ['videoTitle'],
    })
    .refine(b => Boolean(b.videoUrl?.trim() || b.video?.trim()), {
      message: 'Video file is required',
      path: ['videoUrl'],
    })
    .refine(b => Boolean(b.thumbnailUrl?.trim() || b.image?.trim()), {
      message: 'Thumbnail is required',
      path: ['thumbnailUrl'],
    })
    .refine(
      b => {
        const list = b.primaryArtists?.length
          ? b.primaryArtists
          : Array.isArray(b.primaryArtist)
            ? b.primaryArtist
            : b.primaryArtist
              ? [b.primaryArtist]
              : [];
        return list.length > 0;
      },
      {
        message: 'At least one primary artist is required',
        path: ['primaryArtists'],
      },
    ),
});

// PATCH /update-video swaps the video/image file on an existing release —
// the target id travels in the body (there's no :id in the route).
const updateVideoFileSchema = z.object({
  body: z.object({
    id: objectId(),
  }),
});

export const VideoZodSchema = {
  uploadVideoSchema,
  updateVideoFileSchema,
};
