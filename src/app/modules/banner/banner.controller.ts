import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';

import sendResponse from '../../../shared/sendResponse';
import { BannerService } from './banner.service';

const createBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.createBanner(req as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Success',
    data: result,
  });
});
const getBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getBanner(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Success',
    data: result.data,
    meta: result.meta,
  });
});
const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.deleteBanner(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Success',
    data: result,
  });
});

export const BannerController = {
  createBanner,
  getBanner,
  deleteBanner,
};
