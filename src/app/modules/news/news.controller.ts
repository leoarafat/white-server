import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import { NewsService } from './news.service';
import sendResponse from '../../../shared/sendResponse';

const createNews = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsService.createNews(req as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Success',
    data: result,
  });
});
const getNews = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsService.getNews(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Success',
    data: result.data,
    meta: result.meta,
  });
});
const deleteNews = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsService.deleteNews(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Success',
    data: result,
  });
});

export const NewsController = {
  createNews,
  getNews,
  deleteNews,
};
