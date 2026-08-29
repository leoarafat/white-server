import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import * as PartnerUploadService from './partnerUpload.service';

export const start = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerUploadService.startUpload(req.partnerKey!, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: 'Upload session created', data });
});

export const signParts = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerUploadService.signUploadParts(req.partnerKey!, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

export const complete = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerUploadService.completeUpload(req.partnerKey!, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: 'Upload complete', data });
});
