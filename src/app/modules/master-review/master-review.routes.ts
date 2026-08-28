import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { MasterReviewController } from './master-review.controller';

const router = express.Router();

// Master-only: reviewing what their sub-users have submitted. Deliberately
// NOT permission-gated (requirePermission) — this is inherent to being a
// master account, not something a sub-user could ever be granted.
router.get('/list', auth(ENUM_USER_ROLE.USER), MasterReviewController.list);
router.patch(
  '/approve/:type/:id',
  auth(ENUM_USER_ROLE.USER),
  MasterReviewController.approve,
);
router.patch(
  '/reject/:type/:id',
  auth(ENUM_USER_ROLE.USER),
  MasterReviewController.reject,
);

// "View reason" and "resubmit" deliberately have no routes here — they're
// fully served by the existing admin-correction endpoints
// (catalog-music/correction-data/:id, catalog-music/edit-release/:id,
// catalog-video/correction-data/:id, catalog-video/edit-video/:id), see the
// comment in master-review.service.ts for why that's safe to share.

export const MasterReviewRoutes = router;
