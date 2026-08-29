import express from 'express';
import { requirePartnerScope } from '../../../middlewares/partnerAuth';
import { partnerRateLimit } from '../../../middlewares/partnerRateLimit';
import { validatePartnerBody } from '../../../middlewares/validatePartner';
import { setWebhookSchema } from './partnerWebhook.validation';
import * as PartnerWebhookController from './partnerWebhook.controller';

const router = express.Router();

router.put(
  '/',
  requirePartnerScope('webhook:manage'),
  partnerRateLimit('webhookSet'),
  validatePartnerBody(setWebhookSchema),
  PartnerWebhookController.setWebhook,
);

router.get(
  '/',
  requirePartnerScope('webhook:manage'),
  partnerRateLimit('webhookRead'),
  PartnerWebhookController.getWebhook,
);

router.post(
  '/test',
  requirePartnerScope('webhook:manage'),
  partnerRateLimit('webhookRead'),
  PartnerWebhookController.testWebhook,
);

export const PartnerWebhookRoutes = router;
