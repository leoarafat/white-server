import { z } from 'zod';

export const setWebhookSchema = z.object({
  url: z.string().url().refine(val => val.startsWith('https://'), {
    message: 'Webhook url must use https://',
  }),
  rotateSecret: z.boolean().optional(),
});
