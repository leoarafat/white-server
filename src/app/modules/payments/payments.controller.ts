import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { paymentService } from './payments.service';

const RequestForPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.RequestForPayment(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const addBalanceFromAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.addBalanceFromAdmin(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successfully',
    data: result,
  });
});
const removeBalanceFromAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const result = await paymentService.removeBalanceFromAdmin(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Successfully',
      data: result,
    });
  },
);
const paymentRequestsLists = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.paymentRequestsLists(
    req.params.status,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const makePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.makePayment(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const withdrawAmount = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.withdrawAmount(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const totalPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.totalPayments();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const totalTransaction = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.totalTransaction();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const deleteTransaction = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.deleteTransaction(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const userForPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.userForPayment();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' successfully',
    data: result,
  });
});
const rejectPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.rejectPayment(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successfully',
    data: result,
  });
});
const myTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.myTransactions(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successfully',
    data: result,
  });
});
const paymentDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.paymentDetails(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successfully',
    data: result,
  });
});
const isExistPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.isExistPayment(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successfully',
    data: result,
  });
});
export const paymentController = {
  makePayment,
  withdrawAmount,
  totalPayments,
  totalTransaction,
  deleteTransaction,
  userForPayment,
  RequestForPayment,
  paymentRequestsLists,
  rejectPayment,
  paymentDetails,
  myTransactions,
  addBalanceFromAdmin,
  removeBalanceFromAdmin,
  isExistPayment,
};
