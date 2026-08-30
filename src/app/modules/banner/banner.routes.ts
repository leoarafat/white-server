import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';

import { uploadFile } from '../../middlewares/fileUpload';
import { BannerController } from './banner.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { BannerZodSchema } from './banner.validations';

const router = Router();

router.post(
  '/add',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  validateRequest(BannerZodSchema.createBannerSchema),
  BannerController.createBanner,
);

router.get(
  '/all',
  auth(
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  BannerController.getBanner,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  BannerController.deleteBanner,
);

export const BannerRoutes = router;
