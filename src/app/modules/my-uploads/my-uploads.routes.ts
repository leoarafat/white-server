import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { MyUploadsController } from './my-uploads.controller';
import { requirePermission } from '../../../shared/subUserAccess';

const router = Router();

router.get(
  '/export-songs',
  auth(
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  requirePermission('/my-uploads'),
  MyUploadsController.exportAudioSongs,
);
router.get(
  '/export-video',
  auth(
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  requirePermission('/my-uploads'),
  MyUploadsController.exportVideoSongs,
);
router.get(
  '/export-pending-songs',
  auth(
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  requirePermission('/my-uploads'),
  MyUploadsController.exportPendingAudioSongs,
);
router.get(
  '/export-pending-video',
  auth(
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  requirePermission('/my-uploads'),
  MyUploadsController.exportPendingVideoSongs,
);

router.get(
  '/all-songs',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.allSongs,
);
router.get(
  '/success-songs',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.successReleaseSongs,
);
router.get(
  '/success-videos',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.successReleaseVideos,
);
router.get(
  '/pending-songs',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.pendingSongs,
);
router.get(
  '/pending-videos',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.pendingVideos,
);
router.get(
  '/correction-songs',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.correctionSongs,
);
router.get(
  '/correction-videos',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.correctionVideos,
);
router.get(
  '/take-down-songs',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.takeDownSongs,
);
router.get(
  '/take-down-videos',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.takeDownVideos,
);
router.get(
  '/in-review-songs',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.inReviewSongs,
);
router.get(
  '/in-review-videos',
  auth(ENUM_USER_ROLE.SUB_USER, ENUM_USER_ROLE.USER),
  requirePermission('/my-uploads'),
  MyUploadsController.inReviewVideos,
);

export const MyUploadsRoutes = router;
