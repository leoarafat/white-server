import { z } from 'zod';
import { objectId, requiredString } from '../../../shared/zodCommon';

const addChannelSchema = z.object({
  body: z.object({
    channelName: requiredString('Channel Name'),
    channelSpotifyId: z.string().trim().optional(),
    channelAppleId: z.string().trim().optional(),
    channelFacebookId: z.string().trim().optional(),
    channelInstagramId: z.string().trim().optional(),
    youtubeLink: z.string().trim().optional(),
    keywords: z.array(z.string()).optional(),
    description: z.string().trim().optional(),
    isKids: z.boolean().optional(),
  }),
});

const updateChannelSchema = z.object({
  body: z.object({
    channelName: z.string().trim().min(1).optional(),
    channelSpotifyId: z.string().trim().optional(),
    channelAppleId: z.string().trim().optional(),
    channelFacebookId: z.string().trim().optional(),
    channelInstagramId: z.string().trim().optional(),
    youtubeLink: z.string().trim().optional(),
    keywords: z.array(z.string()).optional(),
    description: z.string().trim().optional(),
    isKids: z.boolean().optional(),
  }),
});

// User-submitted edit request — the channel id being edited travels in the
// body (not the URL) and keywords arrives as a JSON-encoded string, matching
// vevo-channel.service.ts's channelUpdateRequest.
const channelEditRequestSchema = z.object({
  body: z.object({
    id: objectId(),
    keywords: z.string().optional(),
    description: z.string().trim().optional(),
    isForKids: z.string().optional(),
  }),
});

// Admin edit — also keyed by a body `id`, matching updateEditRequest.
const updateEditRequestSchema = z.object({
  body: z.object({
    id: objectId(),
    keywords: z.string().optional(),
    description: z.string().trim().optional(),
    isKids: z.string().optional(),
    channelAppleId: z.string().trim().optional(),
    channelFacebookId: z.string().trim().optional(),
    channelInstagramId: z.string().trim().optional(),
    channelSpotifyId: z.string().trim().optional(),
    channelName: z.string().trim().optional(),
    isApproved: z.enum(['pending', 'approved', 'rejected']).optional(),
    isEditApproved: z.enum(['pending', 'approved', 'rejected']).optional(),
    youtubeLink: z.string().trim().optional(),
    vevoChannel: z.string().trim().optional(),
  }),
});

const updateVevoChannelSchema = z.object({
  body: z.object({
    channelName: z.string().trim().min(1).optional(),
    channelSpotifyId: z.string().trim().optional(),
    channelAppleId: z.string().trim().optional(),
    channelFacebookId: z.string().trim().optional(),
    channelInstagramId: z.string().trim().optional(),
    youtubeLink: z.string().trim().optional(),
    keywords: z.array(z.string()).optional(),
    description: z.string().trim().optional(),
    isKids: z.boolean().optional(),
    isApproved: z.enum(['pending', 'approved', 'rejected']).optional(),
    isEditApproved: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const VevoChannelZodSchema = {
  addChannelSchema,
  updateChannelSchema,
  channelEditRequestSchema,
  updateEditRequestSchema,
  updateVevoChannelSchema,
};
