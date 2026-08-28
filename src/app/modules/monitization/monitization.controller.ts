import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { JwtPayload } from 'jsonwebtoken';
import { IReqUser } from '../../../interfaces/common';
import { MonetizationService } from './monitization.service';

const updateMonetization = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await MonetizationService.updateMonetization(
    req.params.id,
    data,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monetization update successful!',
    data: result,
  });
});
const createMonetization = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const user = req.user;
  const result = await MonetizationService.createMonetization(
    user as IReqUser,
    data,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monetization added successful!',
    data: result,
  });
});
const getMyMonetization = catchAsync(async (req: Request, res: Response) => {
  const result = await MonetizationService.getMyMonetization(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monetization retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});

const getPendingMonetization = catchAsync(
  async (req: Request, res: Response) => {
    const result = await MonetizationService.getPendingMonetization(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Monetization retrieved successful!',
      data: result.data,
      meta: result.meta,
    });
  },
);
const getApprovedMonetization = catchAsync(
  async (req: Request, res: Response) => {
    const result = await MonetizationService.getApprovedMonetization(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Monetization retrieved successful!',
      data: result.data,
      meta: result.meta,
    });
  },
);
const getRejectedMonetization = catchAsync(
  async (req: Request, res: Response) => {
    const result = await MonetizationService.getRejectedMonetization(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Monetization retrieved successful!',
      data: result.data,
      meta: result.meta,
    });
  },
);

export const MonetizationController = {
  createMonetization,
  updateMonetization,
  getMyMonetization,
  getPendingMonetization,
  getApprovedMonetization,
  getRejectedMonetization,
};
