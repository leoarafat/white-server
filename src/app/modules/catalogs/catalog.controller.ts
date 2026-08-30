import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { catalogMusicService } from './catalog.service';

const releaseSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.releaseSongs(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const pendingSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.pendingSongs(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const correctionSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.correctionSongs(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const takeDownSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.takeDownSongs(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const inReviewSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.inReviewSongs(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const moveToInReview = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.moveToInReview(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const deleteSong = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.deleteSong(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Deleted Successful',
    data: result,
  });
});
const songInspection = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.songInspection(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const distributeMusic = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.distributeMusic(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const distributeMusicWithoutPDL = catchAsync(
  async (req: Request, res: Response) => {
    const result = await catalogMusicService.distributeMusicWithoutPDL(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Successful',
      data: result,
    });
  },
);
const editMusic = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.editMusic(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Edit Successful',
    data: result,
  });
});
const editMusicForAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.editMusicForAdmin(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Edit Successful',
    data: result,
  });
});
const makeTakeDown = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.makeTakeDown(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Take Successful',
    data: result,
  });
});
const removeTakeDown = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.removeTakeDown(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Take Successful',
    data: result,
  });
});
const correctionContent = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.correctionContent(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
const correctionData = catchAsync(async (req: Request, res: Response) => {
  const result = await catalogMusicService.correctionData(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
export const catalogMusicController = {
  releaseSongs,
  pendingSongs,
  correctionSongs,
  takeDownSongs,
  inReviewSongs,
  moveToInReview,
  deleteSong,
  songInspection,
  distributeMusic,
  editMusic,
  makeTakeDown,
  removeTakeDown,
  correctionContent,
  correctionData,
  editMusicForAdmin,
  distributeMusicWithoutPDL,
};
