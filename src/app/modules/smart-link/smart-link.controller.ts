import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { smartLinkService } from './smart-link.service';

const createSmartLink = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.createSmartLink(
    req.user as JwtPayload,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart Link created successfully!',
    data: result,
  });
});

const getEligibleReleases = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await smartLinkService.getMyEligibleReleases(
    user.userId,
    req.query.searchTerm as string | undefined,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Eligible releases retrieved successfully!',
    data: result,
  });
});

const getAdminEligibleReleases = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.getAdminEligibleReleases(
    req.query.searchTerm as string | undefined,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Eligible releases retrieved successfully!',
    data: result,
  });
});

const getMyLinks = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.getMyLinks(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart Links retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

const getAllLinks = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.getAllLinks(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart Links retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

const getSingleLink = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.getSingleLink(
    req.params.id,
    req.user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart Link retrieved successfully!',
    data: result,
  });
});

const updateLink = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.updateLink(
    req.params.id,
    req.user as JwtPayload,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart Link updated successfully!',
    data: result,
  });
});

const deleteLink = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.deleteLink(
    req.params.id,
    req.user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart Link deleted successfully!',
    data: result,
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await smartLinkService.getStats(
    req.params.id,
    req.user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart Link stats retrieved successfully!',
    data: result,
  });
});

export const smartLinkController = {
  createSmartLink,
  getEligibleReleases,
  getAdminEligibleReleases,
  getMyLinks,
  getAllLinks,
  getSingleLink,
  updateLink,
  deleteLink,
  getStats,
};
