import { Request, Response } from 'express';

import sendResponse from '../../../shared/sendResponse';

import catchAsync from '../../../shared/catchasync';
import { ResumableUploadService } from './resumable-upload.service';

const initiateUpload = catchAsync(async (req: Request, res: Response) => {
  const result = await ResumableUploadService.initiateUpload(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Upload initiated',
    data: result,
  });
});

const getPresignedUrl = catchAsync(async (req: Request, res: Response) => {
  const result = await ResumableUploadService.getPresignedUrl(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Presigned URL generated',
    data: result,
  });
});

const completeUpload = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const result = await ResumableUploadService.completeUpload(req.body, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Uploaded Successful',
    data: result,
  });
});

const abortUpload = catchAsync(async (req: Request, res: Response) => {
  const result = await ResumableUploadService.abortUpload(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Upload aborted',
    data: result,
  });
});

export const ResumableUploadController = {
  initiateUpload,
  getPresignedUrl,
  completeUpload,
  abortUpload,
};
