import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import { LabelService } from './label.service';
import sendResponse from '../../../shared/sendResponse';
import { resolveOwnerContext } from '../../../shared/subUserAccess';
import { JwtPayload } from 'jsonwebtoken';

const updateLabel = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await LabelService.updateLabel(req.params.id, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label update successful!',
    data: result,
  });
});
const addLabel = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = req.files as any;
  if (files?.avatar?.[0]?.location) {
    data.avatar = files.avatar[0].location;
  }
  if (files?.banner?.[0]?.location) {
    data.banner = files.banner[0].location;
  }
  const result = await LabelService.addLabel(owner, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label added successful!',
    data: result,
  });
});
const updateMyLabel = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = req.files as any;
  if (files?.avatar?.[0]?.location) {
    data.avatar = files.avatar[0].location;
  }
  if (files?.banner?.[0]?.location) {
    data.banner = files.banner[0].location;
  }
  const result = await LabelService.updateMyLabel(req.params.id, owner, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label update successful!',
    data: result,
  });
});
const getMyLabel = catchAsync(async (req: Request, res: Response) => {
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await LabelService.getMyLabel(owner, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getMyApprovedLabel = catchAsync(async (req: Request, res: Response) => {
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await LabelService.getMyApprovedLabel(owner, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getMyPendingLabel = catchAsync(async (req: Request, res: Response) => {
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await LabelService.getMyPendingLabel(owner, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getPendingLabel = catchAsync(async (req: Request, res: Response) => {
  const result = await LabelService.getPendingLabel(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getApprovedLabel = catchAsync(async (req: Request, res: Response) => {
  const result = await LabelService.getApprovedLabel(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getRejectedLabel = catchAsync(async (req: Request, res: Response) => {
  const result = await LabelService.getRejectedLabel(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getAllLabels = catchAsync(async (req: Request, res: Response) => {
  const result = await LabelService.getAllLabels(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Labels retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getMyLabelById = catchAsync(async (req: Request, res: Response) => {
  const result = await LabelService.getMyLabelById(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result,
  });
});
const deleteLabel = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super-admin';
  const owner = isAdmin
    ? null
    : req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await LabelService.deleteLabel(req.params.id, owner);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label delete successful!',
    data: result,
  });
});
const labelByUserId = catchAsync(async (req: Request, res: Response) => {
  const result = await LabelService.labelByUserId(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label retrieved successful!',
    data: result,
  });
});
export const LabelController = {
  getMyLabel,
  addLabel,
  updateLabel,
  updateMyLabel,
  getPendingLabel,
  getRejectedLabel,
  getApprovedLabel,
  getMyPendingLabel,
  getAllLabels,
  deleteLabel,
  getMyLabelById,
  getMyApprovedLabel,
  labelByUserId,
};
