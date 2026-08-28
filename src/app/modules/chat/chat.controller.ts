import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { chatService } from './chat.service';

const ok = (res: Response, data: any, message = 'Success') =>
  sendResponse(res, { statusCode: 200, success: true, message, data });

const getMyConversation = catchAsync(async (req: Request, res: Response) => {
  ok(res, await chatService.getMyConversation(req));
});

const getConversations = catchAsync(async (req: Request, res: Response) => {
  ok(res, await chatService.getConversations(req));
});

const getConversationMessages = catchAsync(
  async (req: Request, res: Response) => {
    ok(res, await chatService.getConversationMessages(req));
  },
);

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  ok(res, await chatService.sendMessage(req), 'Message sent');
});

const markConversationRead = catchAsync(async (req: Request, res: Response) => {
  ok(res, await chatService.markConversationRead(req));
});

export const chatController = {
  getMyConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
};
