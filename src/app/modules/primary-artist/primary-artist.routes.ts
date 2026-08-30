import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { PrimaryArtistController } from './primary-artist.controller';
import { uploadFile } from '../../middlewares/fileUpload';
import {
  attachOwnerContext,
  requirePermission,
} from '../../../shared/subUserAccess';
import { validateRequest } from '../../middlewares/validateRequest';
import { PrimaryArtistZodSchema } from './primary-artist.validations';

const router = Router();
router.get(
  '/all',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  attachOwnerContext,
  PrimaryArtistController.getPrimaryArtist,
);
router.get(
  '/all-artists',
  auth(
    ENUM_USER_ROLE.ADMIN,

    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  PrimaryArtistController.allArtist,
);
router.post(
  '/all-by-ids',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  PrimaryArtistController.getArtistsByIds,
);
router.post(
  '/feature-by-ids',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  PrimaryArtistController.getFeatureArtistsByIds,
);

router.post(
  '/add-artist',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  uploadFile,
  validateRequest(PrimaryArtistZodSchema.addPrimaryArtistSchema),
  PrimaryArtistController.addPrimaryArtist,
);
router.get(
  '/artist/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  PrimaryArtistController.artistByUserId,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  PrimaryArtistController.deletePrimaryArtist,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/artist-management'),
  uploadFile,
  validateRequest(PrimaryArtistZodSchema.updatePrimaryArtistSchema),
  PrimaryArtistController.updatePrimaryArtist,
);
export const PrimaryArtistRoutes = router;
