import express from 'express';
import { AdminController } from './admin.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { StaticsController } from '../statics/statics.controller';
import { paymentController } from '../payments/payments.controller';
import { UserController } from '../user/user.controller';
import { uploadFile } from '../../middlewares/fileUpload';

const router = express.Router();
router.get(
  '/users',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.ADMIN),
  UserController.getAllUsers,
);
router.get(
  '/admins',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.getAllAdmin,
);
router.post(
  '/add-user',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.createUser,
);
router.post('/register', AdminController.registerAdmin);
router.post(
  '/make-admin',
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.registerAdmin,
);
router.post('/login', AdminController.login);
router.post('/refresh-token', AdminController.refreshToken);
router.post('/logout', AdminController.logout);
router.post(
  '/change-password',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.changePassword,
);
router.get(
  '/profile',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.myProfile,
);
router.patch(
  '/update-profile',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  AdminController.updateAdmin,
);
router.patch(
  '/update-user/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),

  AdminController.updateUserProfile,
);
//!Payment
router.delete(
  '/delete-transaction/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.deleteTransaction,
);
router.delete(
  '/delete-admin/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.deleteAdmin,
);
router.delete(
  '/delete-user/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  AdminController.deleteUser,
);
//! Statics Analytics
router.get('/analytics/:id', StaticsController.generateAnalytics);
//! Admin Update

export const AdminRoutes = router;
