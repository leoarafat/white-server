import express from 'express';
import auth from '../../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../../enums/user';
import * as PartnerActivityController from './partnerActivity.controller';

const router = express.Router();

router.get(
  '/',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  PartnerActivityController.list,
);

export const PartnerActivityAdminRoutes = router;
