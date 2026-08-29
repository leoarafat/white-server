import express from 'express';
import auth from '../../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../../enums/user';
import * as PartnerKeyController from './partnerKey.controller';

const router = express.Router();

// Admin-only key management — fixes finding #1 from the old ApiKey module,
// which mounted these routes with no auth at all.
const adminOnly = auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN);

router.post('/', adminOnly, PartnerKeyController.createKey);
router.get('/', adminOnly, PartnerKeyController.listKeys);
router.delete('/:id', adminOnly, PartnerKeyController.revokeKey);

export const PartnerKeyAdminRoutes = router;
