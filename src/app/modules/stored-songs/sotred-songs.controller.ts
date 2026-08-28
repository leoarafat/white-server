import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { StoreService } from './sotred-songs.service';

const addSongInStore = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.addSongInStore(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store create successful',
    data: result,
  });
});

const getStoreBySong = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.getStoreBySong(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store retrieved successful',
    data: result,
  });
});
const updateStoreForSong = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.updateStoreForSong(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store update successful',
    data: result,
  });
});

export const StoreController = {
  addSongInStore,
  getStoreBySong,
  updateStoreForSong,
};
