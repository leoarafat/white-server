import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from './ticket.model';

const createTicketSchema = z.object({
  body: z.object({
    subject: requiredString('Subject'),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    // message may be omitted if an attachment is included instead — the
    // message-or-attachment rule is enforced in ticket.service.ts.
    message: z.string().trim().optional(),
  }),
});

// message is optional for the same reason as createTicketSchema.
const replyToTicketSchema = z.object({
  body: z.object({
    message: z.string().trim().optional(),
  }),
});

const updateTicketStatusSchema = z.object({
  body: z.object({
    status: z.enum(TICKET_STATUSES, {
      required_error: 'status is required',
    }),
  }),
});

const updateTicketMetaSchema = z.object({
  body: z.object({
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assignedAdmin: z.string().trim().nullable().optional(),
  }),
});

export const TicketZodSchema = {
  createTicketSchema,
  replyToTicketSchema,
  updateTicketStatusSchema,
  updateTicketMetaSchema,
};
