import { z } from 'zod';

// text is optional here because a message may be attachment-only — the
// text-or-attachment requirement is enforced in chat.service.ts where
// req.files is available.
const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().trim().optional(),
  }),
});

export const ChatZodSchema = {
  sendMessageSchema,
};
