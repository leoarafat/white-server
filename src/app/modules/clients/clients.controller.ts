import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { ClientService } from './clients.service';

//! Add note, make terminate and lock User
const addNoteInUser = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await ClientService.addNoteInUser(data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const addRevenuePercent = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientService.addRevenuePercent(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const lockUserAccount = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await ClientService.lockUserAccount(data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const UnlockUserAccount = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await ClientService.UnlockUserAccount(data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const approveOrReject = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await ClientService.approveOrReject(data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const verifiedUser = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientService.verifiedUser(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const rejectedUser = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientService.rejectedUser(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const PendingUser = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientService.PendingUser(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const lockedUser = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientService.lockedUser(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientService.deleteUser(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientService.getSingleUser(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});

export const ClientController = {
  UnlockUserAccount,
  addNoteInUser,
  lockUserAccount,
  addRevenuePercent,
  approveOrReject,
  verifiedUser,
  PendingUser,
  lockedUser,
  deleteUser,
  getSingleUser,
  rejectedUser,
};
