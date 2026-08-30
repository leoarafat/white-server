import { Router } from 'express';
import multer from 'multer';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { ReportConverterController } from './report-converter.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { ReportConverterZodSchema } from './report-converter.validations';

const router = Router();

// Memory storage: this file is transient (never written to DB or R2), so
// there's no reason to round-trip it through the bucket like statics/add.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post(
  '/upload',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  upload.single('file'),
  ReportConverterController.uploadAndAnalyze,
);

router.post(
  '/convert',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(ReportConverterZodSchema.convertSchema),
  ReportConverterController.convert,
);

router.get(
  '/status/:jobId',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ReportConverterController.getStatus,
);

router.get(
  '/download/:jobId',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ReportConverterController.download,
);

router.get(
  '/templates',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ReportConverterController.getTemplates,
);

router.post(
  '/templates',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(ReportConverterZodSchema.saveTemplateSchema),
  ReportConverterController.saveTemplate,
);

router.delete(
  '/templates/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ReportConverterController.deleteTemplate,
);

export const ReportConverterRoutes = router;
