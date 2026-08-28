import { Schema, model } from 'mongoose';
import { IAppNotification } from './notification.interface';

const notificationSchema = new Schema<IAppNotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
      refPath: 'recipientModel',
    },
    recipientModel: {
      type: String,
      enum: ['User', 'Admin'],
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    link: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientModel: 1, recipientId: 1, createdAt: -1 });

export const AppNotification = model<IAppNotification>(
  'AppNotification',
  notificationSchema,
);
