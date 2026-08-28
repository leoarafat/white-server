/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { createError } from '../../utils/error';
import httpStatus from 'http-status';
import { ApiKey } from '../modules/ApiKey/ApiKey.model';

export const authenticateKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return next(createError(httpStatus.UNAUTHORIZED, 'API key is required'));
    }

    const keyRecord = await ApiKey.findOne({ accessKey: apiKey });

    if (!keyRecord) {
      return next(createError(httpStatus.UNAUTHORIZED, 'Invalid API key'));
    }

    req.company = keyRecord.companyName;
    req.permissions = keyRecord.permissions;

    next();
  } catch (err: any) {
    next(createError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const checkPermission = (requiredPermission: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.permissions || !req.permissions.includes(requiredPermission)) {
      return next(
        createError(httpStatus.FORBIDDEN, 'Insufficient permissions'),
      );
    }
    next();
  };
};
