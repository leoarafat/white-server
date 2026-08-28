import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { MonetizationController } from './monitization.controller';
import { requirePermission } from '../../../shared/subUserAccess';

const router = Router();
router.get(
  '/pending',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  MonetizationController.getPendingMonetization,
);
router.get(
  '/approved',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  MonetizationController.getApprovedMonetization,
);
router.get(
  '/rejected',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  MonetizationController.getRejectedMonetization,
);

router.post(
  '/create-monetization',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/monetization'),
  MonetizationController.createMonetization,
);
router.get(
  '/my-monetizations',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/monetization'),
  MonetizationController.getMyMonetization,
);

router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  MonetizationController.updateMonetization,
);

export const MonetizationRoutes = router;
