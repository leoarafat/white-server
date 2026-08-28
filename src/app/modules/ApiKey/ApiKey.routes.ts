import express from 'express';

import { createApiKey, getAllApiKeys, revokeApiKey } from './ApiKey.controller';

const router = express.Router();
router.post('/', createApiKey);
router.get('/', getAllApiKeys);
router.delete('/:id', revokeApiKey);

export const APIKeyRoutes = router;
