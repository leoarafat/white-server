import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const addNoteSchema = z.object({
  body: z.object({
    description: requiredString('description'),
  }),
});

const updateNoteSchema = z.object({
  body: z.object({
    description: z.string().trim().min(1).optional(),
  }),
});

export const NoteZodSchema = {
  addNoteSchema,
  updateNoteSchema,
};
