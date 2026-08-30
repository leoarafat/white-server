import express from 'express';

import {
  createNotice,
  deleteNotice,
  getNotices,
  toggleNoticeStatus,
  updateNotice,
} from './notice.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { validateRequest } from '../../middlewares/validateRequest';
import { NoticeZodSchema } from './notice.validations';

const router = express.Router();

const adminOnly = auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN);

router.post(
  '/',
  adminOnly,
  validateRequest(NoticeZodSchema.createNoticeSchema),
  createNotice,
);
router.get('/', getNotices);
router.put(
  '/:id',
  adminOnly,
  validateRequest(NoticeZodSchema.updateNoticeSchema),
  updateNotice,
);
router.delete('/:id', adminOnly, deleteNotice);
router.patch('/:id/toggle-status', adminOnly, toggleNoticeStatus);

export const noticeRoutes = router;
