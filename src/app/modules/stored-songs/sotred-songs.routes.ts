import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { StoreController } from './sotred-songs.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { StoredSongsZodSchema } from './sotred-songs.validations';

const router = Router();

router.post(
  '/add',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  validateRequest(StoredSongsZodSchema.addSongInStoreSchema),
  StoreController.addSongInStore,
);
router.get(
  '/single/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  StoreController.getStoreBySong,
);
router.patch(
  '/update/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  validateRequest(StoredSongsZodSchema.updateStoreForSongSchema),
  StoreController.updateStoreForSong,
);

export const StoredSongsRoutes = router;
