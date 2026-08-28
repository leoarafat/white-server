import express from 'express';

import { ENUM_USER_ROLE } from '../../../enums/user';
import { ResumableUploadController } from './resumable-upload.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Step 1: Client requests a multipart upload session
router.post(
  '/initiate',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  ResumableUploadController.initiateUpload,
);

// Step 2: Client requests presigned URLs for each chunk
router.post(
  '/presign-part',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  ResumableUploadController.getPresignedUrl,
);

// Step 3: Client signals all parts uploaded — we complete the multipart upload + save to DB
router.post(
  '/complete',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  ResumableUploadController.completeUpload,
);

// Step 4 (optional): Client aborts a failed upload to clean up S3 parts
router.post(
  '/abort',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  ResumableUploadController.abortUpload,
);

export const ResumableUploadRoutes = router;
