import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { SecurityController } from './security.controller';
import { requirePermission } from '../../../shared/subUserAccess';

const router = express.Router();

const authed = auth(
  ENUM_USER_ROLE.USER,
  ENUM_USER_ROLE.SUB_USER,
  ENUM_USER_ROLE.ADMIN,
  ENUM_USER_ROLE.SUPER_ADMIN,
);

// ── Public login-flow endpoints (no session yet) ─────────────────────────────
router.post('/2fa/login-verify', SecurityController.loginVerify2FA);
router.post('/passkeys/login-options', SecurityController.passkeyLoginOptions);
router.post('/passkeys/login-verify', SecurityController.passkeyLoginVerify);

// ── Authenticated endpoints (user or admin) ──────────────────────────────────
router.get(
  '/2fa/status',
  authed,
  requirePermission('/security'),
  SecurityController.twoFAStatus,
);
router.post(
  '/2fa/setup',
  authed,
  requirePermission('/security'),
  SecurityController.setup2FA,
);
router.post(
  '/2fa/verify-enable',
  authed,
  requirePermission('/security'),
  SecurityController.verifyEnable2FA,
);
router.post(
  '/2fa/disable',
  authed,
  requirePermission('/security'),
  SecurityController.disable2FA,
);

router.get(
  '/passkeys',
  authed,
  requirePermission('/security'),
  SecurityController.listPasskeys,
);
router.post(
  '/passkeys/register-options',
  authed,
  requirePermission('/security'),
  SecurityController.passkeyRegisterOptions,
);
router.post(
  '/passkeys/register-verify',
  authed,
  requirePermission('/security'),
  SecurityController.passkeyRegisterVerify,
);
router.delete(
  '/passkeys/:id',
  authed,
  requirePermission('/security'),
  SecurityController.deletePasskey,
);

router.get(
  '/sessions',
  authed,
  requirePermission('/security'),
  SecurityController.getSessions,
);
router.post(
  '/sessions/revoke-others',
  authed,
  requirePermission('/security'),
  SecurityController.revokeOtherSessions,
);

export const SecurityRoutes = router;
