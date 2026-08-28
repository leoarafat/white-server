import { Schema, model, Types } from 'mongoose';

export type ITicketAttachment = {
  url: string;
  name: string;
  type: string;
  size?: number;
};

const attachmentSchema = new Schema<ITicketAttachment>(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number },
  },
  { _id: false },
);

export const TICKET_CATEGORIES = [
  'general',
  'technical',
  'billing',
  'copyright',
  'distribution',
  'other',
] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const TICKET_STATUSES = [
  'open',
  'pending',
  'resolved',
  'closed',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export type ITicket = {
  ticketNumber: string;
  subject: string;
  category: (typeof TICKET_CATEGORIES)[number];
  priority: (typeof TICKET_PRIORITIES)[number];
  status: TicketStatus;
  user: Types.ObjectId;
  assignedAdmin?: Types.ObjectId | null;
  lastReplyAt: Date;
  lastReplyBy: 'user' | 'admin';
  unreadByUser: number;
  unreadByAdmin: number;
};

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    category: { type: String, enum: TICKET_CATEGORIES, default: 'general' },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'medium' },
    status: { type: String, enum: TICKET_STATUSES, default: 'open' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    lastReplyAt: { type: Date, default: Date.now },
    lastReplyBy: { type: String, enum: ['user', 'admin'], default: 'user' },
    unreadByUser: { type: Number, default: 0 },
    unreadByAdmin: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });

export type ITicketMessage = {
  ticket: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: 'user' | 'admin';
  message: string;
  attachments: ITicketAttachment[];
};

const ticketMessageSchema = new Schema<ITicketMessage>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true },
);

// Sequential human-readable ticket numbers via an atomic counter.
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const Ticket = model<ITicket>('Ticket', ticketSchema);
export const TicketMessage = model<ITicketMessage>(
  'TicketMessage',
  ticketMessageSchema,
);
export const TicketCounter = model('TicketCounter', counterSchema);

export const nextTicketNumber = async (): Promise<string> => {
  const counter = await TicketCounter.findOneAndUpdate(
    { key: 'ticket' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `TKT-${String(counter.seq).padStart(6, '0')}`;
};
