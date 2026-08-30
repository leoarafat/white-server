import express from 'express';
import multer from 'multer';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { TransferOwnershipController } from './transfer-ownership.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { TransferOwnershipZodSchema } from './transfer-ownership.validations';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get(
  '/users',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  TransferOwnershipController.listUsers,
);

router.get(
  '/user-videos/:userId',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  TransferOwnershipController.getApprovedVideosByUser,
);

router.post(
  '/csv',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  upload.single('file'),
  validateRequest(TransferOwnershipZodSchema.transferByCsvSchema),
  TransferOwnershipController.transferByCsv,
);

router.post(
  '/by-ids',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(TransferOwnershipZodSchema.transferByIdsSchema),
  TransferOwnershipController.transferByIds,
);

export const TransferOwnershipRoutes = router;
