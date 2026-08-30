import express from 'express';

import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { uploadFile } from '../../middlewares/fileUpload';
import { validateRequest } from '../../middlewares/validateRequest';
import { VideoController } from './videos.controller';
import { VideoZodSchema } from './videos.validation';
import { requirePermission } from '../../../shared/subUserAccess';

const router = express.Router();

router.post(
  '/upload',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/release-video'),
  uploadFile,
  validateRequest(VideoZodSchema.uploadVideoSchema),
  VideoController.uploadVideo,
);

// Immediate/background upload of a single video or banner file on select.
router.post(
  '/upload-asset',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/release-video'),
  uploadFile,
  VideoController.uploadVideoAsset,
);

// Save/update an in-progress video release as a draft — bypasses the strict
// Zod schema on purpose, mirroring /single-music/upload-drafts.
router.post(
  '/upload-drafts',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/release-video'),
  VideoController.uploadVideoDraft,
);
router.get(
  '/drafts',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/release-video'),
  VideoController.myVideoDrafts,
);
router.get(
  '/drafts/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/release-video'),
  VideoController.singleVideoDraft,
);
router.delete(
  '/drafts/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/release-video'),
  VideoController.deleteVideoDraft,
);
router.patch(
  '/update-video',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  uploadFile,
  validateRequest(VideoZodSchema.updateVideoFileSchema),
  VideoController.updateVideo,
);

router.get(
  '/all-videos',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  VideoController.myAllVideo,
);
router.get(
  '/download-image',
  auth(
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  VideoController.downloadImage,
);
router.get(
  '/top-uploaders',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  VideoController.topUploaders,
);
router.get(
  '/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  VideoController.singleVideo,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  VideoController.updateSingleVideo,
);

router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  VideoController.deleteSingleVideo,
);
export const VideoRoutes = router;
