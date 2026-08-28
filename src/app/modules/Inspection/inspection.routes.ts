import { Router } from 'express';

import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { activityController } from '../activity/activity.controller';
import { inspectionController } from './Inspection.controller';

const router = Router();
//! Inspection
router.get(
  '/inspections',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  activityController.inspection,
);
router.get(
  '/latest-songs',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  inspectionController.latestSongs,
);
router.get(
  '/failed-inspection',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  activityController.failedInspection,
);
router.get(
  '/processing',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  activityController.processing,
);
router.get(
  '/take-down',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  activityController.takeDown,
);
router.get(
  '/distributed',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  activityController.distributed,
);
router.patch(
  '/make-distribute',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  activityController.makeDistribute,
);
router.patch(
  '/make-takedown',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  activityController.makeTakeDown,
);
//! Inspection
router.get(
  '/user-inspection/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  inspectionController.userInspection,
);
router.get(
  '/song-inspection/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  inspectionController.songInspection,
);
router.get(
  '/total-song/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  inspectionController.userTotalSong,
);

export const InspectionRoutes = router;
