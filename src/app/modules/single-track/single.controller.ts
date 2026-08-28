import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import { SingleMusicService } from './single.service';
import sendResponse from '../../../shared/sendResponse';
import { JwtPayload } from 'jsonwebtoken';

const uploadSingle = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.uploadSingle(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Uploaded Successful',
    data: result,
  });
});
const uploadDrafts = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.uploadDrafts(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Uploaded Successful',
    data: result,
  });
});

// Immediate/background asset upload — client sends a single `audio` or `image`
// file on select and gets back the S3 URL to keep in form state. The final
// `/single-music/upload` submit then just sends these URLs.
const uploadAudioAsset = catchAsync(async (req: Request, res: Response) => {
  const files = (req as any).files || {};
  const uploaded = files?.audio?.[0] || files?.image?.[0];

  if (!uploaded) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'No file uploaded',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Asset Uploaded Successful',
    data: uploaded.location,
  });
});
const myAllMusic = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.myAllMusic(
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
const draftsSong = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.draftsSong(req.user, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result,
  });
});
const singleMusic = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.singleMusic(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result,
  });
});
const singleDraftsMusic = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.singleDraftsMusic(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Retrieved Successful',
    data: result,
  });
});
const updateSingleMusic = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await SingleMusicService.updateSingleMusic(id, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Update Successful',
    data: result,
  });
});
const deleteSingleMusic = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.deleteSingleMusic(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Music Delete Successful',
    data: result,
  });
});
const updateBannerAndAudio = catchAsync(async (req: Request, res: Response) => {
  const result = await SingleMusicService.updateBannerAndAudio(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'File Update Successful',
    data: result,
  });
});
export const SingleMusicController = {
  uploadSingle,
  uploadAudioAsset,
  myAllMusic,
  singleMusic,
  updateSingleMusic,
  deleteSingleMusic,
  uploadDrafts,
  draftsSong,
  singleDraftsMusic,
  updateBannerAndAudio,
};
