import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import * as AdminService from './partnerChannel.admin.service';

const asString = (val: unknown): string | undefined => (typeof val === 'string' ? val : undefined);

export const list = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminService.listPartnerChannelsForAdmin({
    status: asString(req.query.status),
    environment: asString(req.query.environment) as 'live' | 'test' | undefined,
    page: req.query.page ? Number(asString(req.query.page)) : undefined,
    limit: req.query.limit ? Number(asString(req.query.limit)) : undefined,
  });
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminService.adminUpdateChannelStatus(req.params.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: 'Channel status updated', data });
});
