import express from 'express';
import auth from '../../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../../enums/user';
import { validatePartnerBody } from '../../../middlewares/validatePartner';
import { adminUpdateReleaseStatusSchema } from './partnerRelease.validation';
import * as PartnerReleaseAdminController from './partnerRelease.admin.controller';

const router = express.Router();
const adminOnly = auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN);

router.get('/', adminOnly, PartnerReleaseAdminController.list);
router.patch(
  '/:id',
  adminOnly,
  validatePartnerBody(adminUpdateReleaseStatusSchema),
  PartnerReleaseAdminController.updateStatus,
);

export const PartnerReleaseAdminRoutes = router;
