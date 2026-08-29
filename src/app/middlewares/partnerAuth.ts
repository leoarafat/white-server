import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { PartnerKey } from '../modules/partnerApi/key/partnerKey.model';
import { hashPartnerKey } from '../modules/partnerApi/key/partnerKey.utils';
import { PartnerEnvironment, PartnerScope } from '../modules/partnerApi/partnerApi.constants';

export interface PartnerAuthContext {
  keyId: string;
  userId: string;
  environment: PartnerEnvironment;
  scopes: PartnerScope[];
  ipAllowlist: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      partnerKey?: PartnerAuthContext;
    }
  }
}

// Authenticates the x-api-key header. Deliberately silent on *why* a key is
// rejected beyond the documented error shape (§2.8) — never distinguish
// "wrong key" from "revoked key" from "wrong environment" in the response,
// only in what status code comes back.
export const authenticatePartnerKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawKey = req.headers['x-api-key'];
    if (!rawKey || typeof rawKey !== 'string') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'API key is required');
    }

    const keyHash = hashPartnerKey(rawKey);
    const keyRecord = await PartnerKey.findOne({ keyHash });

    if (!keyRecord || keyRecord.revokedAt) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or revoked API key');
    }

    if (keyRecord.ipAllowlist.length > 0) {
      const callerIp = req.ip || '';
      if (!keyRecord.ipAllowlist.includes(callerIp)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'IP address not allowed for this key');
      }
    }

    req.partnerKey = {
      keyId: String(keyRecord._id),
      userId: String(keyRecord.user),
      environment: keyRecord.environment,
      scopes: keyRecord.scopes,
      ipAllowlist: keyRecord.ipAllowlist,
    };

    // Fire-and-forget — a failed lastUsedAt bump must never fail the request.
    PartnerKey.updateOne({ _id: keyRecord._id }, { lastUsedAt: new Date() }).catch(() => {});

    next();
  } catch (error) {
    next(error);
  }
};

export const requirePartnerScope =
  (...scopes: PartnerScope[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const ctx = req.partnerKey;
    if (!ctx) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'API key is required'));
    }
    const hasAll = scopes.every(scope => ctx.scopes.includes(scope));
    if (!hasAll) {
      return next(new ApiError(httpStatus.FORBIDDEN, 'API key is missing a required scope'));
    }
    next();
  };

export const requirePartnerEnvironment =
  (environment: PartnerEnvironment) =>
  (req: Request, res: Response, next: NextFunction) => {
    const ctx = req.partnerKey;
    if (!ctx) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'API key is required'));
    }
    if (ctx.environment !== environment) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, `This endpoint is only available to ${environment} keys`),
      );
    }
    next();
  };
