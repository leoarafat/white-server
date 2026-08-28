import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { paymentController } from './payments.controller';
import { requirePermission } from '../../../shared/subUserAccess';

const router = express.Router();

router.get(
  '/users-payment',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.userForPayment,
);
router.get(
  '/requests-list/:status',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.paymentRequestsLists,
);
router.post(
  '/request',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  // Money-moving action (payout withdrawal request) — was previously
  // reachable by ANY sub-user regardless of granted permission.
  requirePermission('/financial-operations'),
  paymentController.RequestForPayment,
);
router.get(
  '/is-exist',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/financial-operations'),
  paymentController.isExistPayment,
);
router.post(
  '/add-from-admin',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  paymentController.addBalanceFromAdmin,
);
router.post(
  '/remove-from-admin',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  paymentController.removeBalanceFromAdmin,
);
router.post(
  '/reject',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.rejectPayment,
);
router.post(
  '/add-payment',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.makePayment,
);
router.post(
  '/withdraw-payment',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.withdrawAmount,
);
router.get(
  '/total-payments',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.totalPayments,
);
router.get(
  '/total-transaction',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.totalTransaction,
);
router.get(
  '/my-transaction',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  paymentController.myTransactions,
);
router.get(
  '/details/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  paymentController.paymentDetails,
);

export const paymentRoutes = router;
