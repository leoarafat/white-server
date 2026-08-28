import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import { AccountService } from './account.service';
import { IReqUser } from '../../../interfaces/common';
import sendResponse from '../../../shared/sendResponse';

const addBankAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.addBankAccount(
    req.user as IReqUser,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account create successful',
    data: result,
  });
});
const addMobileBankAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.addMobileBankAccount(
    req.user as IReqUser,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account create successful',
    data: result,
  });
});
const addPioneerAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.addPioneerAccount(
    req.user as IReqUser,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account create successful',
    data: result,
  });
});
const getAllBankAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.getAllBankAccount(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account retrieved successful',
    data: result.data,
    meta: result.meta,
  });
});
const getAllMobileBankAccount = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AccountService.getAllMobileBankAccount(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Account retrieved successful',
      data: result.data,
      meta: result.meta,
    });
  },
);
const getAllPioneerAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.getAllPioneerAccount(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account retrieved successful',
    data: result.data,
    meta: result.meta,
  });
});
const myAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.myAccount(req.user as IReqUser);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account retrieved successful',
    data: result,
  });
});
const updates = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.updates(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account update successful',
    data: result,
  });
});
const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.deleteAccount(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account delete successful',
    data: result,
  });
});
export const AccountController = {
  addBankAccount,
  addMobileBankAccount,
  addPioneerAccount,
  getAllBankAccount,
  getAllMobileBankAccount,
  getAllPioneerAccount,
  myAccount,
  updates,
  deleteAccount,
};
