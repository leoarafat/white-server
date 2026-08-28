import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import { MasterReviewService, ReleaseType } from './master-review.service';

const parseType = (raw: string): ReleaseType => {
  if (raw === 'audio' || raw === 'video') return raw;
  throw new ApiError(400, `Invalid release type "${raw}" — expected audio or video`);
};

const list = catchAsync(async (req: Request, res: Response) => {
  //@ts-ignore
  const masterId = req.user?.userId?.toString();
  const { status, type } = req.query as { status?: string; type?: string };
  const result = await MasterReviewService.listForMaster(masterId, {
    status,
    type: type ? parseType(type) : undefined,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sub-user submissions retrieved',
    data: result,
  });
});

const approve = catchAsync(async (req: Request, res: Response) => {
  //@ts-ignore
  const masterId = req.user?.userId?.toString();
  const type = parseType(req.params.type);
  const result = await MasterReviewService.approve(type, req.params.id, masterId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Release approved and sent to admin for review',
    data: result,
  });
});

const reject = catchAsync(async (req: Request, res: Response) => {
  //@ts-ignore
  const masterId = req.user?.userId?.toString();
  const type = parseType(req.params.type);
  const result = await MasterReviewService.reject(
    type,
    req.params.id,
    masterId,
    req.body?.reason,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Release rejected',
    data: result,
  });
});

export const MasterReviewController = {
  list,
  approve,
  reject,
};
