import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { ChannelController } from './vevo-channel.controller';
import { uploadFile } from '../../middlewares/fileUpload';
import {
  attachOwnerContext,
  requirePermission,
} from '../../../shared/subUserAccess';
import { validateRequest } from '../../middlewares/validateRequest';
import { VevoChannelZodSchema } from './vevo-channel.validations';

const router = Router();

router.post(
  '/vevo/channel-callback',

  ChannelController.vevoChannelCreation,
);

router.get(
  '/all',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  attachOwnerContext,
  ChannelController.getChannel,
);
router.get(
  '/approved-channel',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  attachOwnerContext,
  ChannelController.getApprovedChannel,
);
router.get(
  '/pending',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ChannelController.getPendingVevoChannel,
);
router.get(
  '/approved',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ChannelController.getApprovedVevoChannel,
);
router.get(
  '/rejected',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ChannelController.getRejectedVevoChannel,
);
router.get(
  '/edit-requested',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ChannelController.editRequestPending,
);
router.patch(
  '/edit-request-update',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  validateRequest(VevoChannelZodSchema.updateEditRequestSchema),
  ChannelController.updateEditRequest,
);
router.post(
  '/all-by-ids',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  ChannelController.getChannelByIds,
);

router.post(
  '/add-channel',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  validateRequest(VevoChannelZodSchema.addChannelSchema),
  ChannelController.addChannel,
);
router.patch(
  '/edit-request',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  uploadFile,
  validateRequest(VevoChannelZodSchema.channelEditRequestSchema),
  ChannelController.channelUpdateRequest,
);
router.delete(
  '/delete/:id',
  auth(
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  requirePermission('/artist-management'),
  ChannelController.deleteChannel,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  validateRequest(VevoChannelZodSchema.updateChannelSchema),
  ChannelController.updateChannel,
);
router.patch(
  '/update-channel/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(VevoChannelZodSchema.updateVevoChannelSchema),
  ChannelController.updateVevoChannel,
);
router.patch(
  '/approve-edit-request/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ChannelController.approveEditRequest,
);
router.get(
  '/single/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  ChannelController.singleChannel,
);

export const ChannelRoutes = router;
