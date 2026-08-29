import express from 'express';
import auth from '../../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../../enums/user';
import { validatePartnerBody } from '../../../middlewares/validatePartner';
import { adminUpdateChannelStatusSchema } from './partnerChannel.validation';
import * as PartnerChannelAdminController from './partnerChannel.admin.controller';

const router = express.Router();
const adminOnly = auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN);

router.get('/', adminOnly, PartnerChannelAdminController.list);
router.patch(
  '/:id',
  adminOnly,
  validatePartnerBody(adminUpdateChannelStatusSchema),
  PartnerChannelAdminController.updateStatus,
);

export const PartnerChannelAdminRoutes = router;
