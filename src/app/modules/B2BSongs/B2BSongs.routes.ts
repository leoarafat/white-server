/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import {
  authenticateKey,
  checkPermission,
} from '../../middlewares/authenticateKey';

import { createSong, transferSong, updateSong } from './B2BSongs.controller';
import { uploadFile } from '../../middlewares/fileUpload';
// import { parseMetadata } from './parseMetadata ';

const router = express.Router();
router.use(authenticateKey);
router.post('/create', checkPermission('song:create'), createSong);
router.post(
  '/transfer',
  checkPermission('song:create'),
  uploadFile,
  transferSong as any,
);

router.patch('/update//:id', checkPermission('song:update'), updateSong);

export const B2BRoutes = router;
