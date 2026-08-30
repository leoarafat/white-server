import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

// Every "update" endpoint in this module only ever changes approvedStatus
// (see claim-release.service.ts) — same shape reused for all 8 request types.
const updateApprovedStatusSchema = z.object({
  body: z.object({
    approvedStatus: z.enum(['pending', 'approved', 'rejected'], {
      required_error: 'approvedStatus is required',
    }),
  }),
});

const addTikTokClaimSchema = z.object({
  body: z.object({
    email: requiredString('Email').email('A valid email is required'),
    songTitle: requiredString('Song Title'),
    ugclink: requiredString('UGC Link'),
    pgcLink: requiredString('PGC Link'),
    timeForPgc: requiredString('Time For PGC'),
    timeForUgc: requiredString('Time For UGC'),
  }),
});

const addArtistChannelRequestSchema = z.object({
  body: z.object({
    channel_link: requiredString('Channel Link'),
    upc_1: requiredString('UPC 1'),
    topic_link: requiredString('Topic Link'),
    upc_2: requiredString('UPC 2'),
    upc_3: requiredString('UPC 3'),
  }),
});

const addYoutubeManualClaimSchema = z.object({
  body: z.object({
    email: requiredString('Email').email('A valid email is required'),
    songTitle: requiredString('Song Title'),
    url: requiredString('URL'),
  }),
});

const addYoutubeTakeDownSchema = z.object({
  body: z.object({
    email: requiredString('Email').email('A valid email is required'),
    songTitle: requiredString('Song Title'),
    url: requiredString('URL'),
  }),
});

const addYoutubeClaimRequestSchema = z.object({
  body: z.object({
    email: requiredString('Email').email('A valid email is required'),
    songTitle: requiredString('Song Title'),
    url: z.string().trim().optional(),
  }),
});

const addFacebookWhitelistRequestSchema = z.object({
  body: z.object({
    email: requiredString('Email').email('A valid email is required'),
    labelName: requiredString('Label Name'),
    url: requiredString('URL'),
  }),
});

const addFacebookClaimRequestSchema = z.object({
  body: z.object({
    email: requiredString('Email').email('A valid email is required'),
    songTitle: requiredString('Song Title'),
    url: requiredString('URL'),
  }),
});

const addWhitelistRequestSchema = z.object({
  body: z.object({
    url: requiredString('URL'),
  }),
});

export const ClaimReleaseZodSchema = {
  updateApprovedStatusSchema,
  addTikTokClaimSchema,
  addArtistChannelRequestSchema,
  addYoutubeManualClaimSchema,
  addYoutubeTakeDownSchema,
  addYoutubeClaimRequestSchema,
  addFacebookWhitelistRequestSchema,
  addFacebookClaimRequestSchema,
  addWhitelistRequestSchema,
};
