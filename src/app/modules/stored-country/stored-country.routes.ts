import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { CountryController } from './stored-country.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { CountryZodSchema } from './stored-country.validations';

const router = Router();

router.post(
  '/add',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CountryZodSchema.addSongInCountrySchema),
  CountryController.addSongInCountry,
);
router.get(
  '/single/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.USER,
  ),
  CountryController.getCountryBySong,
);
router.patch(
  '/update/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(CountryZodSchema.updateCountryForSongSchema),
  CountryController.updateCountryForSong,
);

export const CountrySongsRoutes = router;
