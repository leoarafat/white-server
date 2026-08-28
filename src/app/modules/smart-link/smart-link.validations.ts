import { z } from 'zod';

// Only DSPs the artist would actually distribute to are whitelisted, to stop
// the redirect endpoint from being used as an open redirector.
export const DSP_WHITELIST: Record<string, RegExp> = {
  spotify: /(^|\.)open\.spotify\.com$/i,
  apple_music: /(^|\.)music\.apple\.com$/i,
  youtube_music: /(^|\.)music\.youtube\.com$/i,
  jiosaavn: /(^|\.)(www\.)?jiosaavn\.com$/i,
  gaana: /(^|\.)gaana\.com$/i,
  amazon_music: /(^|\.)music\.amazon\.[a-z.]+$/i,
  wynk: /(^|\.)wynk\.in$/i,
  hungama: /(^|\.)hungama\.com$/i,
};

export const isWhitelistedDspUrl = (platform: string, url: string) => {
  const pattern = DSP_WHITELIST[platform];
  if (!pattern) return false;
  try {
    const { hostname, protocol } = new URL(url);
    return protocol === 'https:' && pattern.test(hostname);
  } catch {
    return false;
  }
};

const dspLinkSchema = z.object({
  platform: z.enum(Object.keys(DSP_WHITELIST) as [string, ...string[]], {
    required_error: 'platform is required',
  }),
  url: z.string().url({ message: 'A valid https URL is required' }),
});

export const createSmartLinkSchema = z.object({
  body: z
    .object({
      single: z.string({ required_error: 'single is required' }),
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, 'slug can only contain lowercase letters, numbers and hyphens')
        .optional(),
      dspLinks: z.array(dspLinkSchema).min(1, 'At least one DSP link is required'),
      userId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      data.dspLinks.forEach((link, index) => {
        if (!isWhitelistedDspUrl(link.platform, link.url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dspLinks', index, 'url'],
            message: `URL does not match an official ${link.platform} link`,
          });
        }
      });
    }),
});

export const updateSmartLinkSchema = z.object({
  body: z
    .object({
      dspLinks: z.array(dspLinkSchema).min(1).optional(),
      status: z.enum(['active', 'disabled']).optional(),
    })
    .superRefine((data, ctx) => {
      data.dspLinks?.forEach((link, index) => {
        if (!isWhitelistedDspUrl(link.platform, link.url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dspLinks', index, 'url'],
            message: `URL does not match an official ${link.platform} link`,
          });
        }
      });
    }),
});
