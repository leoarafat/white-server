import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { AccountController } from './account.controller';
import { requirePermission } from '../../../shared/subUserAccess';
import { validateRequest } from '../../middlewares/validateRequest';
import { AccountZodSchema } from './account.validations';
const router = Router();
router.post(
  '/add-bank',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/add-account'),
  validateRequest(AccountZodSchema.addBankAccountSchema),
  AccountController.addBankAccount,
);
router.post(
  '/add-mobile-bank',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/add-account'),
  validateRequest(AccountZodSchema.addMobileBankAccountSchema),
  AccountController.addMobileBankAccount,
);
router.post(
  '/add-pioneer',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/add-account'),
  validateRequest(AccountZodSchema.addPioneerAccountSchema),
  AccountController.addPioneerAccount,
);
router.get(
  '/all-bank',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AccountController.getAllBankAccount,
);
router.get(
  '/all-mobile-bank',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AccountController.getAllMobileBankAccount,
);
router.get(
  '/all-pioneer',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AccountController.getAllPioneerAccount,
);
router.get(
  '/my-account',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-account'),
  AccountController.myAccount,
);
router.patch(
  '/edit/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(AccountZodSchema.updateAccountSchema),
  AccountController.updates,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AccountController.deleteAccount,
);
export const AccountRoutes = router;
