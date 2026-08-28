import { Router } from 'express';

import { AcrController } from './acr.controller';
const router = Router();

router.post(
  '/audio/:id',

  AcrController.recognizeMusic,
);
router.post(
  '/video/:id',

  AcrController.recognizeVideo,
);

export const RecognizeRoutes = router;
