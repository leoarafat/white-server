import express from 'express';
import { requirePartnerScope, requirePartnerEnvironment } from '../../../middlewares/partnerAuth';
import { partnerRateLimit } from '../../../middlewares/partnerRateLimit';
import { validatePartnerBody, validatePartnerQuery } from '../../../middlewares/validatePartner';
import {
  createReleaseSchema,
  listReleaseQuerySchema,
  simulateReleaseSchema,
  updateReleaseSchema,
} from './partnerRelease.validation';
import * as PartnerReleaseController from './partnerRelease.controller';

// Mounted under /partner (authenticatePartnerKey already applied by the
// parent router).
const router = express.Router();

router.post(
  '/',
  requirePartnerScope('release:write'),
  partnerRateLimit('releaseCreate'),
  validatePartnerBody(createReleaseSchema),
  PartnerReleaseController.create,
);

router.get(
  '/',
  requirePartnerScope('release:read'),
  partnerRateLimit('releaseList'),
  validatePartnerQuery(listReleaseQuerySchema),
  PartnerReleaseController.list,
);

router.get(
  '/:id',
  requirePartnerScope('release:read'),
  partnerRateLimit('releaseRead'),
  PartnerReleaseController.getById,
);

router.patch(
  '/:id',
  requirePartnerScope('release:write'),
  partnerRateLimit('releaseCreate'),
  validatePartnerBody(updateReleaseSchema),
  PartnerReleaseController.update,
);

router.post(
  '/:id/simulate',
  requirePartnerScope('release:write'),
  requirePartnerEnvironment('test'),
  partnerRateLimit('simulate'),
  validatePartnerBody(simulateReleaseSchema),
  PartnerReleaseController.simulate,
);

export const PartnerReleaseRoutes = router;
