import { Router } from 'express';
import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { smartLinkController } from './smart-link.controller';
import {
  createSmartLinkSchema,
  updateSmartLinkSchema,
} from './smart-link.validations';
import { requirePermission } from '../../../shared/subUserAccess';

const router = Router();

const STAFF_ROLES = [ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN];

router.post(
  '/create',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER, ...STAFF_ROLES),
  requirePermission('/smart-links'),
  validateRequest(createSmartLinkSchema),
  smartLinkController.createSmartLink,
);
router.get(
  '/eligible-releases',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/smart-links'),
  smartLinkController.getEligibleReleases,
);
router.get(
  '/admin/eligible-releases',
  auth(...STAFF_ROLES),
  smartLinkController.getAdminEligibleReleases,
);
router.get(
  '/my',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/smart-links'),
  smartLinkController.getMyLinks,
);
router.get('/all', auth(...STAFF_ROLES), smartLinkController.getAllLinks);
router.get(
  '/single/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER, ...STAFF_ROLES),
  requirePermission('/smart-links'),
  smartLinkController.getSingleLink,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER, ...STAFF_ROLES),
  requirePermission('/smart-links'),
  validateRequest(updateSmartLinkSchema),
  smartLinkController.updateLink,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER, ...STAFF_ROLES),
  requirePermission('/smart-links'),
  smartLinkController.deleteLink,
);
router.get(
  '/stats/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER, ...STAFF_ROLES),
  requirePermission('/smart-links'),
  smartLinkController.getStats,
);

export const SmartLinkRoutes = router;
