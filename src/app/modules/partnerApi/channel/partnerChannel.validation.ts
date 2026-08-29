import { z } from 'zod';

export const createChannelSchema = z.object({
  channelName: z.string().min(1),
  artistName: z.string().optional(),
});

export const simulateChannelSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

export const adminUpdateChannelStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  channelUrl: z.string().url().optional(),
  youtubeChannelId: z.string().optional(),
});
