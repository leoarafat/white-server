import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { RevelatorSettingsService } from './revelator.settings.service';

const getSettings: RequestHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await RevelatorSettingsService.getSettings();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Revelator settings',
      data: result,
    });
  },
);

const saveSettings: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const adminId = req.user?.userId;
    const result = await RevelatorSettingsService.saveSettings(
      username,
      password,
      adminId,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Revelator settings saved',
      data: result,
    });
  },
);

export const RevelatorSettingsController = { getSettings, saveSettings };
