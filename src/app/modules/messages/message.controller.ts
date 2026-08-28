import { Request, RequestHandler, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchasync';
import { messageService } from './message.service';
const sendMessage: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await messageService.sendMessage(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Message Send`,
      data: result,
    });
  },
);
const sendNotification: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await messageService.sendNotification(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Notification Send`,
      data: result,
    });
  },
);
const getMessages: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await messageService.getMessages(req, res);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result,
    });
  },
);
const conversationUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await messageService.conversationUser(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Conversation Retrieved Successful',
      data: result,
    });
  },
);

export const messageController = {
  sendMessage,
  getMessages,
  conversationUser,
  sendNotification,
};
