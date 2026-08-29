import express from 'express';
import { requirePartnerScope, requirePartnerEnvironment } from '../../../middlewares/partnerAuth';
import { partnerRateLimit } from '../../../middlewares/partnerRateLimit';
import { validatePartnerBody } from '../../../middlewares/validatePartner';
import { createChannelSchema, simulateChannelSchema } from './partnerChannel.validation';
import * as PartnerChannelController from './partnerChannel.controller';

const router = express.Router();

router.post(
  '/',
  requirePartnerScope('channel:write'),
  partnerRateLimit('channelCreate'),
  validatePartnerBody(createChannelSchema),
  PartnerChannelController.create,
);

router.get(
  '/',
  requirePartnerScope('channel:read'),
  partnerRateLimit('channelList'),
  PartnerChannelController.list,
);

router.post(
  '/:id/simulate',
  requirePartnerScope('channel:write'),
  requirePartnerEnvironment('test'),
  partnerRateLimit('simulate'),
  validatePartnerBody(simulateChannelSchema),
  PartnerChannelController.simulate,
);

export const PartnerChannelRoutes = router;
