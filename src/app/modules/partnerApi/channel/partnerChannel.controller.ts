import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import * as PartnerChannelService from './partnerChannel.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerChannelService.createChannel(req.partnerKey!, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: 'Channel request received', data });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const data = await PartnerChannelService.listChannels(req.partnerKey!);
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});
