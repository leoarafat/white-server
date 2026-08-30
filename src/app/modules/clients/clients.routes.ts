import { Router } from 'express';
import { ClientController } from './clients.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { validateRequest } from '../../middlewares/validateRequest';
import { ClientZodSchema } from './clients.validations';

const router = Router();

router.get(
  '/verified',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ClientController.verifiedUser,
);
router.get(
  '/pending',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ClientController.PendingUser,
);
router.get(
  '/rejected',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ClientController.rejectedUser,
);
router.get(
  '/locked',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ClientController.lockedUser,
);
router.post(
  '/add-user-note',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ClientController.addNoteInUser,
);
router.post(
  '/approve-reject',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(ClientZodSchema.approveOrRejectSchema),
  ClientController.approveOrReject,
);

router.post(
  '/ad-revenue',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(ClientZodSchema.addRevenuePercentSchema),
  ClientController.addRevenuePercent,
);
router.post(
  '/lock-user',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(ClientZodSchema.lockUnlockUserSchema),
  ClientController.lockUserAccount,
);
router.post(
  '/un-lock-user',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(ClientZodSchema.lockUnlockUserSchema),
  ClientController.UnlockUserAccount,
);
router.get(
  '/user/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ClientController.getSingleUser,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ClientController.deleteUser,
);

export const ClientRoutes = router;
