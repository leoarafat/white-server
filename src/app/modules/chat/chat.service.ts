import { Request } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { emitToAdmins, emitToUser } from '../../../socket/socket';
import { notificationService } from '../notifications/notification.service';
import User from '../user/user.model';
import {
  ChatConversation,
  ChatMessage,
  IAttachment,
} from './chat.model';

const ADMIN_ROLES = ['admin', 'super-admin'];

const isAdmin = (req: Request) =>
  ADMIN_ROLES.includes((req.user?.role as string) || '');

const extractAttachments = (req: Request): IAttachment[] => {
  const files = (req.files as Record<string, any[]>) || {};
  const list = files.attachments || [];
  return list.map(f => ({
    url: f.location,
    name: f.originalname,
    type: f.mimetype,
    size: f.size,
  }));
};

const getOrCreateConversation = async (userId: string) => {
  let conversation = await ChatConversation.findOne({ user: userId });
  if (!conversation) {
    conversation = await ChatConversation.create({ user: userId });
  }
  return conversation;
};

// ---- User side ----
const getMyConversation = async (req: Request) => {
  const userId = req.user?.userId;
  const conversation = await getOrCreateConversation(userId);

  const messages = await ChatMessage.find({
    conversation: conversation._id,
  }).sort({ createdAt: 1 });

  // Opening the thread clears the user's unread counter.
  if (conversation.unreadByUser > 0) {
    conversation.unreadByUser = 0;
    await conversation.save();
  }

  return { conversation, messages };
};

// ---- Admin side ----
const getConversations = async (req: Request) => {
  const search = (req.query.search as string) || '';

  const conversations = await ChatConversation.find()
    .sort({ lastMessageAt: -1 })
    .populate('user', 'name email avatar image')
    .lean();

  if (!search) return conversations;

  const lower = search.toLowerCase();
  return conversations.filter((c: any) => {
    const u = c.user || {};
    return (
      u.name?.toLowerCase().includes(lower) ||
      u.email?.toLowerCase().includes(lower)
    );
  });
};

const getConversationMessages = async (req: Request) => {
  const { userId } = req.params;
  const conversation = await getOrCreateConversation(userId);

  const messages = await ChatMessage.find({
    conversation: conversation._id,
  }).sort({ createdAt: 1 });

  if (conversation.unreadByAdmin > 0) {
    conversation.unreadByAdmin = 0;
    await conversation.save();
  }

  return { conversation, messages };
};

// ---- Shared send ----
const sendMessage = async (req: Request) => {
  const admin = isAdmin(req);
  const senderId = req.user?.userId;
  const text = (req.body?.text || '').trim();
  const attachments = extractAttachments(req);

  if (!text && attachments.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Message text or an attachment is required',
    );
  }

  // The target user's id: for a user it's themselves; for an admin it's the
  // :userId route param (whose thread they're replying in).
  const targetUserId = admin ? req.params.userId : senderId;
  if (!targetUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Target user is required');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const conversation = await getOrCreateConversation(targetUserId);

  const message = await ChatMessage.create({
    conversation: conversation._id,
    senderId,
    senderRole: admin ? 'admin' : 'user',
    text,
    attachments,
  });

  const preview =
    text || (attachments.length ? `📎 ${attachments.length} attachment(s)` : '');

  conversation.lastMessage = preview;
  conversation.lastMessageAt = new Date();
  if (admin) {
    conversation.unreadByUser += 1;
  } else {
    conversation.unreadByAdmin += 1;
  }
  await conversation.save();

  // Live delivery: push the message to the other party's room, plus the
  // sender's own room so their other open tabs stay in sync.
  if (admin) {
    emitToUser(String(targetUserId), 'chat:message', message);
  } else {
    emitToAdmins('chat:message', message);
  }
  emitToUser(String(senderId), 'chat:message', message);

  // A durable bell notification for the recipient.
  if (admin) {
    await notificationService.createAndEmitNotification({
      recipientId: targetUserId,
      recipientModel: 'User',
      type: 'chat_message',
      title: 'New message from support',
      message: preview,
      link: '/chat',
    });
  } else {
    await notificationService.createAndEmitNotification({
      recipientModel: 'Admin',
      type: 'chat_message',
      title: `New message from ${targetUser.name || 'a user'}`,
      message: preview,
      entityType: 'chat',
      entityId: conversation._id,
      link: '/chat',
    });
  }

  return message;
};

const markConversationRead = async (req: Request) => {
  const admin = isAdmin(req);
  const targetUserId = admin ? req.params.userId : req.user?.userId;
  const conversation = await getOrCreateConversation(targetUserId);
  if (admin) conversation.unreadByAdmin = 0;
  else conversation.unreadByUser = 0;
  await conversation.save();
  return conversation;
};

export const chatService = {
  getMyConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
};
