import express from 'express';
import { authenticatePartnerKey } from '../../middlewares/partnerAuth';
import { partnerActivityLogger } from '../../middlewares/partnerActivityLogger';
import { me } from './me/me.controller';
import { PartnerReleaseRoutes } from './release/partnerRelease.routes';
import { PartnerUploadRoutes } from './upload/partnerUpload.routes';
import { PartnerChannelRoutes } from './channel/partnerChannel.routes';
import { PartnerWebhookRoutes } from './webhook/partnerWebhook.routes';

// Mounted at /partner. Every route here is authenticated by API key, never
// by the DFS user/admin session — authenticatePartnerKey runs once for the
// whole router. Later phases (releases, uploads, channels, webhooks,
// simulate) add their own sub-routers below, each with its own scope +
// environment + rate-limit middleware per endpoint.
const router = express.Router();

router.use(authenticatePartnerKey);
router.use(partnerActivityLogger);

router.get('/me', me);
router.use('/releases', PartnerReleaseRoutes);
router.use('/uploads', PartnerUploadRoutes);
router.use('/channels', PartnerChannelRoutes);
router.use('/webhook', PartnerWebhookRoutes);

export const PartnerApiRoutes = router;
