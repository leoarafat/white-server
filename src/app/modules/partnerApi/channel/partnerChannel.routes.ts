import express from 'express';
import { requirePartnerScope } from '../../../middlewares/partnerAuth';
import { partnerRateLimit } from '../../../middlewares/partnerRateLimit';
import { validatePartnerBody } from '../../../middlewares/validatePartner';
import { createChannelSchema } from './partnerChannel.validation';
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

export const PartnerChannelRoutes = router;
