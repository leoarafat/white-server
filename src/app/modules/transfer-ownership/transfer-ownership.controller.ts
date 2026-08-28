import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { TransferOwnershipService } from './transfer-ownership.service';

const transferByCsv = catchAsync(async (req: Request, res: Response) => {
  const { toUserId } = req.body;
  const result = await TransferOwnershipService.transferByCsv(
    (req as any).file,
    toUserId,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Ownership transferred successfully',
    data: result,
  });
});

const getApprovedVideosByUser = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await TransferOwnershipService.getApprovedVideosByUser(
      userId,
      req.query,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Approved videos retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

const transferByIds = catchAsync(async (req: Request, res: Response) => {
  const { fromUserId, toUserId, videoIds } = req.body;
  const result = await TransferOwnershipService.transferByIds(
    fromUserId,
    toUserId,
    videoIds,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Ownership transferred successfully',
    data: result,
  });
});

const listUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await TransferOwnershipService.listUsers(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

export const TransferOwnershipController = {
  transferByCsv,
  getApprovedVideosByUser,
  transferByIds,
  listUsers,
};
