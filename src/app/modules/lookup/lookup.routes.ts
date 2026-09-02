import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { LookupController } from './lookup.controller';

const router = express.Router();

const anyAuth = auth(
  ENUM_USER_ROLE.USER,
  ENUM_USER_ROLE.SUB_USER,
  ENUM_USER_ROLE.ADMIN,
  ENUM_USER_ROLE.SUPER_ADMIN,
);

router.get('/languages', anyAuth, LookupController.getLanguages);
router.get('/genres', anyAuth, LookupController.getGenres);
router.get('/contributor-roles', anyAuth, LookupController.getContributorRoles);

export const LookupRoutes = router;
