import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { RevelatorSettingsController } from './revelator.settings.controller';
import { RevelatorUploadController } from './revelator.upload.controller';
import { RevelatorAnalyticsController } from './revelator.analytics.controller';

const router = express.Router();

// Admin credential settings — read allowed for ADMIN, write restricted to
// SUPER_ADMIN (it's a shared platform-wide login, confirmed with the client).
router.get(
  '/settings',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  RevelatorSettingsController.getSettings,
);
router.put(
  '/settings',
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  RevelatorSettingsController.saveSettings,
);

// Admin action: queue a track for the upload bot.
router.post(
  '/send/:trackId',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  RevelatorUploadController.sendToRevelator,
);

// User-facing analytics (own tracks only, scoped via req.user in the service).
router.get(
  '/analytics',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  RevelatorAnalyticsController.getAnalytics,
);

export const RevelatorRoutes = router;
