import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { PARTNER_RATE_LIMITS, PartnerRateLimitCategory } from '../modules/partnerApi/partnerApi.constants';

// In-memory, per-key, fixed-window (1 minute) limiter — §2.9. This holds only
// as long as this note is true: dashboard-for-sale runs as a single process
// per client deployment. If a deployment is ever scaled horizontally, this
// must move to a shared store (e.g. Redis) or limits become per-instance
// instead of per-key.
const windows = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key);
  }
}, WINDOW_MS).unref();

export const partnerRateLimit =
  (category: PartnerRateLimitCategory) =>
  (req: Request, res: Response, next: NextFunction) => {
    const keyId = req.partnerKey?.keyId;
    if (!keyId) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'API key is required'));
    }

    const limit = PARTNER_RATE_LIMITS[category];
    const bucketKey = `${keyId}:${category}`;
    const now = Date.now();

    let entry = windows.get(bucketKey);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      windows.set(bucketKey, entry);
    }

    entry.count += 1;

    if (entry.count > limit) {
      const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('RateLimit-Reset', String(resetInSeconds));
      return next(
        new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Rate limit exceeded for this API key'),
      );
    }

    next();
  };
