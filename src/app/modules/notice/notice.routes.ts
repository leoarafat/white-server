import express from 'express';

import {
  createNotice,
  deleteNotice,
  getNotices,
  toggleNoticeStatus,
  updateNotice,
} from './notice.controller';

const router = express.Router();

router.post('/', createNotice);
router.get('/', getNotices);
router.put('/:id', updateNotice);
router.delete('/:id', deleteNotice);
router.patch('/:id/toggle-status', toggleNoticeStatus);

export const noticeRoutes = router;
