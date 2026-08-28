// routes/admin/balanceSync.route.ts
import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import {
  getAllUsersBalance,
  triggerBalanceSync,
} from './balanceSync.controller';

const router = express.Router();

router.post(
  '/sync',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  triggerBalanceSync,
);

router.get(
  '/balances',
  auth(
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.SUB_USER,
  ),
  getAllUsersBalance,
);

export const UserBalanceRoutes = router;
