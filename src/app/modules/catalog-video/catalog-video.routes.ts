import { Router } from 'express';

import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { catalogVideoController } from './catalog-video.controller';
import { requirePermission } from '../../../shared/subUserAccess';

const router = Router();

router.get(
  '/approved-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.releaseSongs,
);
router.get(
  '/pending-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.pendingSongs,
);
router.get(
  '/in-review-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.inReviewSongs,
);
router.get(
  '/take-down-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.takeDownSongs,
);
router.get(
  '/correction-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.correctionSongs,
);
router.get(
  '/inspect-song/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  catalogVideoController.songInspection,
);
router.get(
  '/correction-data/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  catalogVideoController.correctionData,
);
router.patch(
  '/distribute/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.distributeMusic,
);
router.patch(
  '/move-to-review/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.moveToInReview,
);
router.patch(
  '/edit-release/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.editMusic,
);
router.patch(
  '/edit-video/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  catalogVideoController.editVideo,
);
router.patch(
  '/manual-approved/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  catalogVideoController.manualApprove,
);
router.patch(
  '/transfer/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.transferToVevo,
);
router.get(
  '/transfer/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.transferFile,
);
router.patch(
  '/make-take-down/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.makeTakeDown,
);
router.patch(
  '/remove-take-down/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.removeTakeDown,
);
router.patch(
  '/correction-video/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogVideoController.correctionContent,
);

export const CatalogVideoRoutes = router;
