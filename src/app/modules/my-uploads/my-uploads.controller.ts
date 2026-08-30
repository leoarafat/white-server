/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import { MyUploadService } from './my-uploads.service';
import sendResponse from '../../../shared/sendResponse';
import { JwtPayload } from 'jsonwebtoken';

const pendingSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.pendingSongs(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const allSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.allSongs(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result,
  });
});
const successReleaseSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.successReleaseSongs(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const correctionSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.correctionSongs(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const takeDownSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.takeDownSongs(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const pendingVideos = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.pendingVideos(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const successReleaseVideos = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.successReleaseVideos(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const correctionVideos = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.correctionVideos(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const takeDownVideos = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.takeDownVideos(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const inReviewSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.inReviewSongs(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const inReviewVideos = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.inReviewVideos(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const exportAudioSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.exportAudioSongs(req.user as any);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Retrieved Successful',
    data: result,
  });
});
const exportVideoSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await MyUploadService.exportVideoSongs(req.user as any);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Retrieved Successful',
    data: result,
  });
});
const exportPendingAudioSongs = catchAsync(
  async (req: Request, res: Response) => {
    const result = await MyUploadService.exportPendingAudioSongs(
      req.user as any,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Retrieved Successful',
      data: result,
    });
  },
);
const exportPendingVideoSongs = catchAsync(
  async (req: Request, res: Response) => {
    const result = await MyUploadService.exportPendingVideoSongs(
      req.user as any,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Retrieved Successful',
      data: result,
    });
  },
);
export const MyUploadsController = {
  pendingSongs,
  pendingVideos,
  successReleaseSongs,
  successReleaseVideos,
  correctionSongs,
  correctionVideos,
  takeDownSongs,
  takeDownVideos,
  inReviewSongs,
  inReviewVideos,
  allSongs,
  exportAudioSongs,
  exportVideoSongs,
  exportPendingAudioSongs,
  exportPendingVideoSongs,
};
