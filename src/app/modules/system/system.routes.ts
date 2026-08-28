import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { SystemController } from './system.controller';

const router = express.Router();

router.get(
  '/health',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  SystemController.getHealth,
);

router.post(
  '/cleanup',
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  SystemController.cleanup,
);

export const SystemRoutes = router;
