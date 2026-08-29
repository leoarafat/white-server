import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import * as PartnerReleaseService from './partnerRelease.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const result = await PartnerReleaseService.createRelease(req.partnerKey!, req.body);
  sendResponse(res, {
    statusCode: result.status,
    success: true,
    message: result.message,
    data: result.data,
  });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerReleaseService.listReleases(req.partnerKey!, req.partnerQuery || {});
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerReleaseService.getReleaseById(req.partnerKey!, req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

export const simulate = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerReleaseService.simulateReleaseTransition(
    req.partnerKey!,
    req.params.id,
    req.body,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Simulated transition applied', data });
});
