import { Router } from 'express';

import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { catalogMusicController } from './catalog.controller';
import { requirePermission } from '../../../shared/subUserAccess';
import { validateRequest } from '../../middlewares/validateRequest';
import { CatalogMusicZodSchema } from './catalog.validations';

const router = Router();

router.get(
  '/approved-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogMusicController.releaseSongs,
);
router.get(
  '/pending-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogMusicController.pendingSongs,
);
router.get(
  '/take-down-songs',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  catalogMusicController.takeDownSongs,
);
router.get(
  '/correction-songs',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  catalogMusicController.correctionSongs,
);
router.get(
  '/in-review-songs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogMusicController.inReviewSongs,
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
  catalogMusicController.correctionData,
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
  catalogMusicController.songInspection,
);
router.patch(
  '/distribute/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CatalogMusicZodSchema.idParamsSchema),
  catalogMusicController.distributeMusic,
);
router.patch(
  '/move-to-review/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CatalogMusicZodSchema.idParamsSchema),
  catalogMusicController.moveToInReview,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  catalogMusicController.deleteSong,
);
router.patch(
  '/distribute-without-pdl/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CatalogMusicZodSchema.idParamsSchema),
  catalogMusicController.distributeMusicWithoutPDL,
);
router.patch(
  '/edit-release/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  validateRequest(CatalogMusicZodSchema.editReleaseSchema),
  catalogMusicController.editMusic,
);
router.patch(
  '/edit-release-admin/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CatalogMusicZodSchema.editReleaseSchema),
  catalogMusicController.editMusicForAdmin,
);
router.patch(
  '/make-take-down/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CatalogMusicZodSchema.idParamsSchema),
  catalogMusicController.makeTakeDown,
);
router.patch(
  '/remove-take-down/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CatalogMusicZodSchema.idParamsSchema),
  catalogMusicController.removeTakeDown,
);
router.patch(
  '/correction-song/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/my-uploads'),
  validateRequest(CatalogMusicZodSchema.correctionSongSchema),
  catalogMusicController.correctionContent,
);
export const CatalogRoutes = router;
