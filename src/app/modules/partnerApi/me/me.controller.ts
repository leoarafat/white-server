import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import { getPartnerMe } from '../key/partnerKey.service';

export const me = catchAsync(async (req: Request, res: Response) => {
  const ctx = req.partnerKey!;
  const data = await getPartnerMe(ctx.userId, ctx.environment, ctx.scopes);
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});
