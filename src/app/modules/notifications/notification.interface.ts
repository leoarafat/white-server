import { Types } from 'mongoose';

export type NotificationType =
  | 'submission'
  | 'approval'
  | 'rejection'
  | 'block'
  | 'takedown'
  | 'report'
  | 'chat_message'
  | 'ticket_created'
  | 'ticket_reply'
  | 'ticket_status';

export type IAppNotification = {
  // Null recipientId + recipientModel 'Admin' means "broadcast to all admins".
  recipientId?: Types.ObjectId | string | null;
  recipientModel: 'User' | 'Admin';
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: Types.ObjectId | string;
  link?: string;
  isRead: boolean;
};

export type CreateNotificationInput = {
  recipientId?: Types.ObjectId | string | null;
  recipientModel: 'User' | 'Admin';
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: Types.ObjectId | string;
  link?: string;
};
