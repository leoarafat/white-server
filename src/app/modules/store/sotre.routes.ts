import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { uploadFile } from '../../middlewares/fileUpload';
import { StoreController } from './sotre.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { StoreZodSchema } from './sotre.validation';

const router = Router();

router.post(
  '/add',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  validateRequest(StoreZodSchema.createStoreSchema),
  StoreController.addStore,
);
router.get(
  '/all',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  StoreController.getStores,
);
router.get(
  '/single/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  StoreController.getSingle,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  validateRequest(StoreZodSchema.updateStoreSchema),
  StoreController.updates,
);
router.delete(
  '/delete/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  StoreController.deleteStore,
);

export const StoreRoutes = router;
