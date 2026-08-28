import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { StoreService } from './sotre.service';

const addStore = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.addStore(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store create successful',
    data: result,
  });
});
const getStores = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.getStores(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store retrieved successful',
    data: result,
  });
});
const getSingle = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.getSingle(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store retrieved successful',
    data: result,
  });
});
const updates = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.updates(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store update successful',
    data: result,
  });
});
const deleteStore = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.deleteStore(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Store delete successful',
    data: result,
  });
});

export const StoreController = {
  addStore,
  getStores,
  getSingle,
  updates,
  deleteStore,
};
