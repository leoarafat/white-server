import express from 'express';
import { requirePartnerScope } from '../../../middlewares/partnerAuth';
import { partnerRateLimit } from '../../../middlewares/partnerRateLimit';
import { validatePartnerBody } from '../../../middlewares/validatePartner';
import { startUploadSchema, signPartsSchema, completeUploadSchema } from './partnerUpload.validation';
import * as PartnerUploadController from './partnerUpload.controller';

const router = express.Router();

router.post(
  '/',
  requirePartnerScope('upload:write'),
  partnerRateLimit('uploadStart'),
  validatePartnerBody(startUploadSchema),
  PartnerUploadController.start,
);

router.post(
  '/parts',
  requirePartnerScope('upload:write'),
  partnerRateLimit('uploadSignParts'),
  validatePartnerBody(signPartsSchema),
  PartnerUploadController.signParts,
);

router.post(
  '/complete',
  requirePartnerScope('upload:write'),
  partnerRateLimit('uploadStart'),
  validatePartnerBody(completeUploadSchema),
  PartnerUploadController.complete,
);

export const PartnerUploadRoutes = router;
