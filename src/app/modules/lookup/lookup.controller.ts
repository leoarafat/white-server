import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { LookupService } from './lookup.service';

const getLanguages: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const result = await LookupService.getLanguages();
  sendResponse(res, { statusCode: 200, success: true, message: 'Languages', data: result });
});

const getGenres: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const result = await LookupService.getGenres();
  sendResponse(res, { statusCode: 200, success: true, message: 'Genres', data: result });
});

const getContributorRoles: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const group = req.query.group ? Number(req.query.group) : undefined;
  const result = await LookupService.getContributorRoles(group);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Contributor roles',
    data: result,
  });
});

export const LookupController = { getLanguages, getGenres, getContributorRoles };
