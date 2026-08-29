import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import * as PartnerWebhookService from './partnerWebhook.service';

export const setWebhook = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerWebhookService.setWebhook(req.partnerKey!, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: 'Webhook set', data });
});

export const getWebhook = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerWebhookService.getWebhookStatus(req.partnerKey!);
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

export const testWebhook = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerWebhookService.testWebhook(req.partnerKey!);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: data.delivered ? 'Your endpoint accepted the test event' : 'Your endpoint did not accept the test event',
    data,
  });
});
