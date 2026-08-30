import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { notificationController } from './notification.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { NotificationZodSchema } from './notification.validations';

const router = express.Router();

const ALL_ROLES = [
  ENUM_USER_ROLE.ADMIN,
  ENUM_USER_ROLE.SUPER_ADMIN,
  ENUM_USER_ROLE.USER,
  ENUM_USER_ROLE.SUB_USER,
];

router.get('/', auth(...ALL_ROLES), notificationController.getNotifications);
router.get(
  '/unread-count',
  auth(...ALL_ROLES),
  notificationController.getUnreadCount,
);
router.patch(
  '/read-all',
  auth(...ALL_ROLES),
  notificationController.markAllAsRead,
);
router.patch(
  '/:id/read',
  auth(...ALL_ROLES),
  validateRequest(NotificationZodSchema.markAsReadSchema),
  notificationController.markAsRead,
);

export const NotificationRoutes = router;
