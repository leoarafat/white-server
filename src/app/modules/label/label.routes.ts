import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { LabelController } from './label.controller';
import { uploadFile } from '../../middlewares/fileUpload';
import {
  attachOwnerContext,
  requirePermission,
} from '../../../shared/subUserAccess';
import { validateRequest } from '../../middlewares/validateRequest';
import { LabelZodSchema } from './label.validations';

const router = Router();
router.get(
  '/all',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  LabelController.getAllLabels,
);
router.get(
  '/pending',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  LabelController.getPendingLabel,
);
router.get(
  '/approved',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  LabelController.getApprovedLabel,
);
router.get(
  '/rejected',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  LabelController.getRejectedLabel,
);

router.post(
  '/add-label',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  uploadFile,
  validateRequest(LabelZodSchema.addLabelSchema),
  LabelController.addLabel,
);
router.patch(
  '/my-update/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  uploadFile,
  validateRequest(LabelZodSchema.updateMyLabelSchema),
  LabelController.updateMyLabel,
);
router.get(
  '/my-label',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  attachOwnerContext,
  LabelController.getMyLabel,
);
router.get(
  '/my-approved-label',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  attachOwnerContext,
  LabelController.getMyApprovedLabel,
);
router.get(
  '/my-pending-label',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  attachOwnerContext,
  LabelController.getMyLabel,
);
router.get(
  '/single/:id',
  auth(
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  LabelController.getMyLabelById,
);
router.get(
  '/label/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  LabelController.labelByUserId,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(LabelZodSchema.updateLabelSchema),
  LabelController.updateLabel,
);
router.delete(
  '/delete/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/artist-management'),
  LabelController.deleteLabel,
);
export const LabelRoutes = router;
