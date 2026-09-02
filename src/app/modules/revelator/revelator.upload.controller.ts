import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { RevelatorUploadService } from './revelator.upload.service';

const sendToRevelator: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const adminId = req.user?.userId as string;
    const result = await RevelatorUploadService.sendToRevelator(
      req.params.trackId,
      adminId,
    );
    sendResponse(res, {
      statusCode: 202,
      success: true,
      message: 'Queued for Revelator',
      data: result,
    });
  },
);

export const RevelatorUploadController = { sendToRevelator };
