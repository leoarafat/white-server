import express from 'express';

// import { uploadSingle } from '../../../utils/multer';
import { SingleMusicController } from './single.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { uploadFile } from '../../middlewares/fileUpload';
import { validateRequest } from '../../middlewares/validateRequest';
import { SingleTrackZodSchema } from './single.validations';
import { requirePermission } from '../../../shared/subUserAccess';

const router = express.Router();

router.post(
  '/upload',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/single'),
  uploadFile,
  validateRequest(SingleTrackZodSchema.uploadSingleSchema),
  SingleMusicController.uploadSingle,
);

// Immediate/background upload of a single audio or cover image file on select.
router.post(
  '/upload-asset',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/single'),
  uploadFile,
  SingleMusicController.uploadAudioAsset,
);
router.post(
  '/upload-drafts',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/single'),
  uploadFile,
  // validateRequest(SingleTrackZodSchema.singleTrackSchema),
  SingleMusicController.uploadDrafts,
);

router.get(
  '/all-music',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  SingleMusicController.myAllMusic,
);
router.get(
  '/drafts',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/single'),
  SingleMusicController.draftsSong,
);
router.get(
  '/drafts/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/single'),
  SingleMusicController.singleDraftsMusic,
);
router.delete(
  '/drafts/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/single'),
  SingleMusicController.deleteDraft,
);
router.get(
  '/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  SingleMusicController.singleMusic,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  SingleMusicController.updateSingleMusic,
);
router.patch(
  '/update-music/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  SingleMusicController.updateSingleMusic,
);
router.patch(
  '/update-banner/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  uploadFile,
  SingleMusicController.updateBannerAndAudio,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  SingleMusicController.deleteSingleMusic,
);

export const SingleMusicRoutes = router;
