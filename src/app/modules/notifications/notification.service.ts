import { Request } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { emitToAdmins, emitToUser } from '../../../socket/socket';
import { CreateNotificationInput } from './notification.interface';
import { AppNotification } from './notification.model';

const ADMIN_ROLES = ['admin', 'super-admin'];

const scopeForRequester = (req: Request) => {
  const { userId, role } = req.user || {};
  if (ADMIN_ROLES.includes(role as string)) {
    return {
      recipientModel: 'Admin',
      $or: [{ recipientId: null }, { recipientId: userId }],
    };
  }
  return { recipientModel: 'User', recipientId: userId };
};

// Single entry point: persist + push over the socket. Every notification in
// the app (submissions, approvals, reports, chat, tickets) goes through this
// so there is exactly one code path for "create + deliver + badge".
const createAndEmitNotification = async (input: CreateNotificationInput) => {
  const notification = await AppNotification.create({
    recipientId: input.recipientId ?? null,
    recipientModel: input.recipientModel,
    type: input.type,
    title: input.title,
    message: input.message,
    entityType: input.entityType,
    entityId: input.entityId,
    link: input.link,
  });

  if (input.recipientModel === 'User' && input.recipientId) {
    emitToUser(String(input.recipientId), 'notification:new', notification);
  } else if (input.recipientModel === 'Admin') {
    emitToAdmins('notification:new', notification);
  }

  return notification;
};

const getNotifications = async (req: Request) => {
  const scope = scopeForRequester(req);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const onlyUnread = req.query.unread === 'true';

  const filter = onlyUnread ? { ...scope, isRead: false } : scope;

  const [items, total] = await Promise.all([
    AppNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AppNotification.countDocuments(filter),
  ]);

  return { items, total, page, limit };
};

const getUnreadCount = async (req: Request) => {
  const scope = scopeForRequester(req);
  const count = await AppNotification.countDocuments({
    ...scope,
    isRead: false,
  });
  return { count };
};

const markAsRead = async (req: Request, id: string) => {
  const scope = scopeForRequester(req);
  const notification = await AppNotification.findOneAndUpdate(
    { _id: id, ...scope },
    { isRead: true },
    { new: true },
  );
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  return notification;
};

const markAllAsRead = async (req: Request) => {
  const scope = scopeForRequester(req);
  await AppNotification.updateMany(
    { ...scope, isRead: false },
    { isRead: true },
  );
  return { success: true };
};

export const notificationService = {
  createAndEmitNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
