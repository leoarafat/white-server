import { Request } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { emitToAdmins, emitToUser } from '../../../socket/socket';
import { notificationService } from '../notifications/notification.service';
import User from '../user/user.model';
import {
  ITicketAttachment,
  Ticket,
  TicketMessage,
  nextTicketNumber,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from './ticket.model';
import { notifyByEmailIfEnabled } from './ticket.email';

const ADMIN_ROLES = ['admin', 'super-admin'];
const isAdmin = (req: Request) =>
  ADMIN_ROLES.includes((req.user?.role as string) || '');

const extractAttachments = (req: Request): ITicketAttachment[] => {
  const files = (req.files as Record<string, any[]>) || {};
  return (files.attachments || []).map(f => ({
    url: f.location,
    name: f.originalname,
    type: f.mimetype,
    size: f.size,
  }));
};

const createTicket = async (req: Request) => {
  const userId = req.user?.userId;
  const { subject, category, priority, message } = req.body;
  const attachments = extractAttachments(req);

  if (!subject?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject is required');
  }
  if (!message?.trim() && attachments.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'An initial message or attachment is required',
    );
  }

  const ticketNumber = await nextTicketNumber();
  const ticket = await Ticket.create({
    ticketNumber,
    subject: subject.trim(),
    category,
    priority,
    user: userId,
    status: 'open',
    lastReplyBy: 'user',
    lastReplyAt: new Date(),
    unreadByAdmin: 1,
  });

  await TicketMessage.create({
    ticket: ticket._id,
    senderId: userId,
    senderRole: 'user',
    message: message?.trim() || '',
    attachments,
  });

  const user = await User.findById(userId);

  emitToAdmins('ticket:update', { ticketId: ticket._id, action: 'created' });
  await notificationService.createAndEmitNotification({
    recipientModel: 'Admin',
    type: 'ticket_created',
    title: `New ticket ${ticketNumber}`,
    message: `${user?.name || 'A user'}: ${subject.trim()}`,
    entityType: 'ticket',
    entityId: ticket._id,
    link: `/support/${ticket._id}`,
  });
  await notifyByEmailIfEnabled({
    subject: `New ticket ${ticketNumber}`,
    body: subject,
  });

  return ticket;
};

const getMyTickets = async (req: Request) => {
  const userId = req.user?.userId;
  const status = req.query.status as string;
  const filter: any = { user: userId };
  if (status && status !== 'all') filter.status = status;
  return Ticket.find(filter).sort({ lastReplyAt: -1 });
};

const getAllTickets = async (req: Request) => {
  const { status, priority, category, assignedAdmin, search } =
    req.query as Record<string, string>;
  const filter: any = {};
  if (status && status !== 'all') filter.status = status;
  if (priority && priority !== 'all') filter.priority = priority;
  if (category && category !== 'all') filter.category = category;
  if (assignedAdmin) filter.assignedAdmin = assignedAdmin;
  if (search) filter.$or = [
    { ticketNumber: { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } },
  ];

  return Ticket.find(filter)
    .sort({ lastReplyAt: -1 })
    .populate('user', 'name email')
    .populate('assignedAdmin', 'name email');
};

const getTicketById = async (req: Request, id: string) => {
  const admin = isAdmin(req);
  const ticket = await Ticket.findById(id)
    .populate('user', 'name email')
    .populate('assignedAdmin', 'name email');
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  if (!admin && ticket.user._id.toString() !== req.user?.userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not your ticket');
  }

  const messages = await TicketMessage.find({ ticket: id }).sort({
    createdAt: 1,
  });

  // Opening the ticket clears the reader's unread counter.
  if (admin && ticket.unreadByAdmin > 0) {
    ticket.unreadByAdmin = 0;
    await ticket.save();
  } else if (!admin && ticket.unreadByUser > 0) {
    ticket.unreadByUser = 0;
    await ticket.save();
  }

  return { ticket, messages };
};

const replyToTicket = async (req: Request, id: string) => {
  const admin = isAdmin(req);
  const senderId = req.user?.userId;
  const message = (req.body?.message || '').trim();
  const attachments = extractAttachments(req);

  if (!message && attachments.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A message or attachment is required',
    );
  }

  const ticket = await Ticket.findById(id).populate('user', 'name email');
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  if (!admin && ticket.user._id.toString() !== senderId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not your ticket');
  }

  const reply = await TicketMessage.create({
    ticket: ticket._id,
    senderId,
    senderRole: admin ? 'admin' : 'user',
    message,
    attachments,
  });

  ticket.lastReplyAt = new Date();
  ticket.lastReplyBy = admin ? 'admin' : 'user';
  // An admin reply moves an open ticket to "pending" (awaiting user); a user
  // reply on a resolved/closed ticket re-opens it.
  if (admin && ticket.status === 'open') ticket.status = 'pending';
  if (!admin && ['resolved', 'closed'].includes(ticket.status))
    ticket.status = 'open';
  if (admin) ticket.unreadByUser += 1;
  else ticket.unreadByAdmin += 1;
  await ticket.save();

  const preview =
    message || (attachments.length ? `📎 ${attachments.length} attachment(s)` : '');

  if (admin) {
    emitToUser(String(ticket.user._id), 'ticket:update', {
      ticketId: ticket._id,
      action: 'reply',
    });
    await notificationService.createAndEmitNotification({
      recipientId: ticket.user._id,
      recipientModel: 'User',
      type: 'ticket_reply',
      title: `Reply on ${ticket.ticketNumber}`,
      message: preview,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/support/${ticket._id}`,
    });
  } else {
    emitToAdmins('ticket:update', { ticketId: ticket._id, action: 'reply' });
    await notificationService.createAndEmitNotification({
      recipientModel: 'Admin',
      type: 'ticket_reply',
      title: `Reply on ${ticket.ticketNumber}`,
      message: preview,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/support/${ticket._id}`,
    });
  }

  return reply;
};

const updateTicketStatus = async (req: Request, id: string) => {
  const { status } = req.body;
  if (!TICKET_STATUSES.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status');
  }
  const admin = isAdmin(req);
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  // Users may only close their own ticket; admins may set any status.
  if (!admin) {
    if (ticket.user.toString() !== req.user?.userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not your ticket');
    }
    if (status !== 'closed') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Users can only close tickets');
    }
  }

  ticket.status = status;
  await ticket.save();

  emitToUser(String(ticket.user), 'ticket:update', {
    ticketId: ticket._id,
    action: 'status',
  });
  emitToAdmins('ticket:update', { ticketId: ticket._id, action: 'status' });

  if (admin) {
    await notificationService.createAndEmitNotification({
      recipientId: ticket.user,
      recipientModel: 'User',
      type: 'ticket_status',
      title: `Ticket ${ticket.ticketNumber} ${status}`,
      message: `Your ticket status changed to "${status}".`,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/support/${ticket._id}`,
    });
  }

  return ticket;
};

const updateTicketMeta = async (req: Request, id: string) => {
  const { priority, assignedAdmin } = req.body;
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  if (priority) {
    if (!TICKET_PRIORITIES.includes(priority)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid priority');
    }
    ticket.priority = priority;
  }
  if (assignedAdmin !== undefined) {
    ticket.assignedAdmin = assignedAdmin || null;
  }
  await ticket.save();

  emitToAdmins('ticket:update', { ticketId: ticket._id, action: 'meta' });
  return ticket;
};

export const ticketService = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  updateTicketMeta,
};
