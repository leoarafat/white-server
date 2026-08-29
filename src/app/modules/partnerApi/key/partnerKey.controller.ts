import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import * as PartnerKeyService from './partnerKey.service';

export const createKey = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerKeyService.createPartnerKey({
    userId: req.body.userId,
    label: req.body.label,
    environment: req.body.environment,
    scopes: req.body.scopes || [],
    ipAllowlist: req.body.ipAllowlist,
  });
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'API key created',
    data,
  });
});

export const listKeys = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerKeyService.listPartnerKeys(req.query.userId as string | undefined);
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

export const revokeKey = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerKeyService.revokePartnerKey(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'API key revoked', data });
});
