import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import { AcrService } from './acr.service';
import sendResponse from '../../../shared/sendResponse';

const recognizeMusic = catchAsync(async (req: Request, res: Response) => {
  const result = await AcrService.recognizeSong(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const recognizeVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await AcrService.recognizeVideo(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});

export const AcrController = {
  recognizeMusic,
  recognizeVideo,
};
