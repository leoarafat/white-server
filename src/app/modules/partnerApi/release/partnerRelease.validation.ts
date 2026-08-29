import { z } from 'zod';

// Accepts a real array, a single string, or a comma-separated string and
// always normalizes to string[] — §2.3 + Appendix A landmine #4. Rejects
// anything else (objects, numbers) outright, which is also what keeps a
// Mongo-operator-shaped payload (`{"$ne": null}`) from ever reaching a query.
const stringArray = () =>
  z.preprocess(val => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    return val;
  }, z.array(z.string().min(1)));

const isoDateWithTimezone = z
  .string()
  .refine(val => /Z$|[+-]\d{2}:?\d{2}$/.test(val), {
    message: 'releaseDate must be ISO 8601 and carry an explicit timezone (e.g. Z or +05:30)',
  })
  .refine(val => !Number.isNaN(Date.parse(val)), { message: 'releaseDate is not a valid date' });

export const createReleaseSchema = z
  .object({
    title: z.string().min(1),
    primaryArtist: stringArray(),
    videoUrl: z.string().url().optional(),
    video: z.string().url().optional(),

    externalId: z.string().min(1).optional(),
    imageUrl: z.string().url().optional(),
    image: z.string().url().optional(),
    thumbnail: z.string().url().optional(),
    featuringArtists: stringArray().optional(),
    label: z.string().optional(),
    genre: stringArray().optional(),
    language: z.string().optional(),
    releaseDate: isoDateWithTimezone.optional(),
    isrc: z.string().optional(),
    channel: z.string().optional(),
    description: z.string().optional(),
    keywords: stringArray().optional(),
    composer: z.string().optional(),
    producer: z.string().optional(),
    editor: z.string().optional(),
    musicDirector: z.string().optional(),
    copyrightYear: z.coerce.number().int().optional(),
  })
  .transform(body => {
    const sourceVideoUrl = body.videoUrl || body.video;
    const imageUrl = body.imageUrl || body.image || body.thumbnail || null;
    return { ...body, sourceVideoUrl, imageUrl };
  })
  .refine(body => !!body.sourceVideoUrl, {
    message: 'videoUrl is required',
    path: ['videoUrl'],
  });

// Same fields as create, all optional — a partner fixing a `needs_fix`
// release sends only what changed. §2.4: needs_fix is "editable, returns to
// review", which this endpoint is what makes true.
export const updateReleaseSchema = z
  .object({
    title: z.string().min(1).optional(),
    primaryArtist: stringArray().optional(),
    videoUrl: z.string().url().optional(),
    video: z.string().url().optional(),

    imageUrl: z.string().url().optional(),
    image: z.string().url().optional(),
    thumbnail: z.string().url().optional(),
    featuringArtists: stringArray().optional(),
    label: z.string().optional(),
    genre: stringArray().optional(),
    language: z.string().optional(),
    releaseDate: isoDateWithTimezone.optional(),
    isrc: z.string().optional(),
    channel: z.string().optional(),
    description: z.string().optional(),
    keywords: stringArray().optional(),
    composer: z.string().optional(),
    producer: z.string().optional(),
    editor: z.string().optional(),
    musicDirector: z.string().optional(),
    copyrightYear: z.coerce.number().int().optional(),
  })
  .transform(body => {
    const sourceVideoUrl = body.videoUrl || body.video;
    const imageUrl = body.imageUrl || body.image || body.thumbnail;
    return { ...body, sourceVideoUrl, imageUrl };
  });

export const simulateReleaseSchema = z
  .object({
    status: z.enum(['pending', 'needs_fix', 'approved', 'delivered', 'rejected', 'taken_down']),
    reason: z.string().min(1).optional(),
  })
  .refine(body => !['needs_fix', 'rejected'].includes(body.status) || !!body.reason, {
    message: 'reason is required when simulating needs_fix or rejected',
    path: ['reason'],
  });

export const listReleaseQuerySchema = z.object({
  updatedSince: z
    .string()
    .refine(val => !Number.isNaN(Date.parse(val)), { message: 'updatedSince is not a valid date' })
    .optional(),
  isrc: z.string().optional(),
  externalId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
