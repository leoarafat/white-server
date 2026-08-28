import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { createIsrc, generateIsrc, isExistPrefix } from './isrc.controller';

const router = Router();
router.post(
  '/generate',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  generateIsrc,
);
router.get(
  '/exist-prefix/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  isExistPrefix,
);
router.post(
  '/create-prefix',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  createIsrc,
);

export const ISRCRoutes = router;
