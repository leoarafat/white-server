import { Router } from 'express';

import { AcrController } from './acr.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { validateRequest } from '../../middlewares/validateRequest';
import { AcrZodSchema } from './acr.validations';
const router = Router();

// Was previously reachable with no auth at all — admin-only catalog tool
// (triggers a paid ACRCloud recognition call), same gap as notices.
const adminOnly = auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN);

router.post(
  '/audio/:id',
  adminOnly,
  validateRequest(AcrZodSchema.recognizeParamsSchema),
  AcrController.recognizeMusic,
);
router.post(
  '/video/:id',
  adminOnly,
  validateRequest(AcrZodSchema.recognizeParamsSchema),
  AcrController.recognizeVideo,
);

export const RecognizeRoutes = router;
