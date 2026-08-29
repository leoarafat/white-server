import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchasync';
import sendResponse from '../../../../shared/sendResponse';
import { listPartnerActivity } from './partnerActivity.service';

// Only ever accept plain strings out of req.query — a query-string value
// shaped like an object (e.g. `?userId[$ne]=`) must never reach the filter.
const asString = (val: unknown): string | undefined => (typeof val === 'string' ? val : undefined);

export const list = catchAsync(async (req: Request, res: Response) => {
  const environment = asString(req.query.environment);
  const data = await listPartnerActivity({
    userId: asString(req.query.userId),
    keyId: asString(req.query.keyId),
    environment: environment === 'live' || environment === 'test' ? environment : undefined,
    page: req.query.page ? Number(asString(req.query.page)) : undefined,
    limit: req.query.limit ? Number(asString(req.query.limit)) : undefined,
  });
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});
