import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { uploadFile } from '../../middlewares/fileUpload';
import { chatController } from './chat.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { ChatZodSchema } from './chat.validations';

const router = express.Router();

const USER_ROLES = [ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER];
const ADMIN_ROLES = [ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN];

// ---- User side ----
router.get(
  '/my-conversation',
  auth(...USER_ROLES),
  chatController.getMyConversation,
);
router.post(
  '/send',
  auth(...USER_ROLES),
  uploadFile,
  validateRequest(ChatZodSchema.sendMessageSchema),
  chatController.sendMessage,
);
router.patch(
  '/my-conversation/read',
  auth(...USER_ROLES),
  chatController.markConversationRead,
);

// ---- Admin side ----
router.get(
  '/conversations',
  auth(...ADMIN_ROLES),
  chatController.getConversations,
);
router.get(
  '/conversations/:userId/messages',
  auth(...ADMIN_ROLES),
  chatController.getConversationMessages,
);
router.post(
  '/conversations/:userId/send',
  auth(...ADMIN_ROLES),
  uploadFile,
  validateRequest(ChatZodSchema.sendMessageSchema),
  chatController.sendMessage,
);
router.patch(
  '/conversations/:userId/read',
  auth(...ADMIN_ROLES),
  chatController.markConversationRead,
);

export const ChatRoutes = router;
