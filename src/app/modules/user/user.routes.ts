import express from 'express';
import { UserController } from './user.controller';
import { SubUserController } from '../sub-user/sub-user.controller';
import { ENUM_USER_ROLE } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { StaticsController } from '../statics/statics.controller';

import { uploadFile } from '../../middlewares/fileUpload';
import { requirePermission } from '../../../shared/subUserAccess';

const router = express.Router();
//!User

router.post('/register', UserController.registrationUser);
router.post(
  '/add-sub-user',
  auth(ENUM_USER_ROLE.USER),
  UserController.createSubUser,
);
router.post('/activate-user', UserController.activateUser);
router.post('/login', UserController.login);
router.post(
  '/login-from-admin',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  UserController.loginUserFromAdmin,
);
router.post(
  '/exchange-impersonation-code',
  UserController.exchangeImpersonationCode,
);
router.post('/refresh-token', UserController.refreshToken);
router.post('/logout', UserController.logout);
router.get('/users', auth(ENUM_USER_ROLE.USER), UserController.getAllUsers);

router.patch(
  '/change-password',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/change-password'),
  UserController.changePassword,
);
//!Sub User
router.post('/register-sub-user', SubUserController.registrationUser);
router.post('/activate-sub-user', SubUserController.activateUser);

//! Verification
router.patch(
  '/profile-verify',
  auth(ENUM_USER_ROLE.USER),
  uploadFile,
  UserController.profileVerification,
);
router.patch(
  '/label-verify',
  auth(ENUM_USER_ROLE.USER),
  uploadFile,
  UserController.labelVerification,
);
router.patch(
  '/add-image',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  UserController.addClientImage,
);
router.patch(
  '/signature-verify',
  auth(ENUM_USER_ROLE.USER),
  uploadFile,
  UserController.signatureVerification,
);
router.patch(
  '/address-verify',
  auth(ENUM_USER_ROLE.USER),
  UserController.updateProfile,
);
router.post(
  '/give-permission',
  auth(ENUM_USER_ROLE.USER),
  UserController.givePermission,
);
router.get(
  '/profile',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  UserController.getSingleUser,
);
router.patch(
  '/verify-profile',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  UserController.updateUser,
);
router.patch(
  '/edit-profile-picture',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  uploadFile,
  UserController.updateProfilePicture,
);
router.get('/my-sub-user', auth(ENUM_USER_ROLE.USER), UserController.mySubUser);

router.patch(
  '/verify-sub-user/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  uploadFile,
  SubUserController.updateUser,
);
router.get(
  '/profile/sub-user/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  SubUserController.getSingleUser,
);
router.get(
  '/sub-users',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  SubUserController.getAllUsers,
);
router.delete(
  '/delete-sub-user/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  SubUserController.deleteUser,
);
router.get(
  '/user/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  UserController.getUserById,
);
//! Analytics
router.get(
  '/correction-album/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  StaticsController.getCorrectionRequestAlbum,
);
router.get(
  '/correction-single-track/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  StaticsController.getCorrectionRequestSingle,
);
router.get(
  '/last-six-approved-track/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  StaticsController.lastSixApprovedTracks,
);

router.get(
  '/analytics/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  StaticsController.generateAnalytics,
);
router.get(
  '/export-users',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  UserController.exportUsers,
);
export const UserRoutes = router;
