import { z } from 'zod';

export const createChannelSchema = z.object({
  channelName: z.string().min(1),
  artistName: z.string().optional(),
});
