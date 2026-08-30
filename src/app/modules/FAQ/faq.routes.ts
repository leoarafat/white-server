import express from 'express';
import { FaqController } from './faq.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { validateRequest } from '../../middlewares/validateRequest';
import { FaqZodSchema } from './faq.validations';

const router = express.Router();

router.post(
  '/create-faq',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(FaqZodSchema.addFaqSchema),
  FaqController.addFaq,
);
router.get(
  '/faq',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  FaqController.getFaq,
);
router.patch(
  '/faq/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(FaqZodSchema.updateFaqSchema),
  FaqController.updateFaq,
);
router.delete(
  '/faq/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  FaqController.deleteFaq,
);

export const FaqRoutes = router;
