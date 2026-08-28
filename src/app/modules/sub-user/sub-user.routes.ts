import express from 'express';
// import { upload } from '../../../utils/multer';
import { SubUserController } from './sub-user.controller';
import { uploadFile } from '../../middlewares/fileUpload';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';

const router = express.Router();
// SECURITY: these routes previously had NO auth middleware at all — any
// unauthenticated caller could change a password, read any account's full
// profile, or delete any user/sub-user by id. `login`/`refresh-token` are
// intentionally the only routes left open (that's how logging in works);
// every other route below now requires a valid session, and the service
// layer additionally enforces that a caller may only touch its own account
// or its own sub-user's account.
router.post('/login', SubUserController.login);
router.post('/refresh-token', SubUserController.refreshToken);
router.patch(
  '/change-password',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  SubUserController.changePassword,
);
router.patch(
  '/verify-profile/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  uploadFile,
  SubUserController.updateUser,
);
router.patch(
  '/profile/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  uploadFile,
  SubUserController.getSingleUser,
);
router.patch(
  '/sub-users/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  uploadFile,
  SubUserController.getAllUsers,
);
router.patch(
  '/delete-sub-user/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  uploadFile,
  SubUserController.deleteUser,
);

export const SubUserRoutes = router;
