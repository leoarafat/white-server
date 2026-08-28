import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { channelService } from './vevo-channel.service';
import { resolveOwnerContext } from '../../../shared/subUserAccess';

const updateChannel = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = req.body;
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await channelService.updateChannel(id, owner, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel update successful!',
    data: result,
  });
});
const approveEditRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await channelService.approveEditRequest(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Approve successful!',
    data: result,
  });
});

const addChannel = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await channelService.addChannel(owner, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel added successful!',
    data: result,
  });
});
const getChannelByIds = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await channelService.getChannelByIds(data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel retrieved successful!',
    data: result,
  });
});

const getChannel = catchAsync(async (req: Request, res: Response) => {
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await channelService.getChannel(owner, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const getApprovedChannel = catchAsync(async (req: Request, res: Response) => {
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await channelService.getApprovedChannel(owner, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const deleteChannel = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super-admin';
  const owner = isAdmin
    ? null
    : req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await channelService.deleteChannel(id, owner);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel retrieved successful!',
    data: result,
  });
});
const updateVevoChannel = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await channelService.updateVevoChannel(req.params.id, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel update successful!',
    data: result,
  });
});
const channelUpdateRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await channelService.channelUpdateRequest(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel update successful!',
    data: result,
  });
});

const getPendingVevoChannel = catchAsync(
  async (req: Request, res: Response) => {
    const result = await channelService.getPendingVevoChannel(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Channel retrieved successful!',
      data: result.data,
      meta: result.meta,
    });
  },
);
const getApprovedVevoChannel = catchAsync(
  async (req: Request, res: Response) => {
    const result = await channelService.getApprovedVevoChannel(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Channel retrieved successful!',
      data: result.data,
      meta: result.meta,
    });
  },
);
const getRejectedVevoChannel = catchAsync(
  async (req: Request, res: Response) => {
    const result = await channelService.getRejectedVevoChannel(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Channel retrieved successful!',
      data: result.data,
      meta: result.meta,
    });
  },
);

const deleteVevoChannel = catchAsync(async (req: Request, res: Response) => {
  const result = await channelService.deleteVevoChannel(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Channel delete successful!',
    data: result,
  });
});
const singleChannel = catchAsync(async (req: Request, res: Response) => {
  const result = await channelService.singleChannel(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful!',
    data: result,
  });
});
const editRequestPending = catchAsync(async (req: Request, res: Response) => {
  const result = await channelService.editRequestPending(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful!',
    data: result,
    meta: result.meta,
  });
});
const updateEditRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await channelService.updateEditRequest(req as any);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful!',
    data: result,
  });
});

const vevoChannelCreation = (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const VEVO_AUTH_TOKEN =
    'Bearer ansMusic$%85928629862dfkdfkjfgjgfdsgh123456789';
  // Authorization check
  if (authHeader !== VEVO_AUTH_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const payload = req.body;

  console.log('✅ Vevo Channel Request Payload Received:', payload);

  return res.status(200).json({ message: 'Received successfully' });
};
export const ChannelController = {
  addChannel,
  updateChannel,
  getChannel,
  deleteChannel,
  getChannelByIds,
  getApprovedChannel,
  updateVevoChannel,
  getPendingVevoChannel,
  getApprovedVevoChannel,
  getRejectedVevoChannel,
  deleteVevoChannel,
  channelUpdateRequest,
  singleChannel,
  editRequestPending,
  updateEditRequest,
  approveEditRequest,
  vevoChannelCreation,
};
