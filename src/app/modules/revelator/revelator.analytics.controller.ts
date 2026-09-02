import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { RevelatorAnalyticsService } from './revelator.analytics.service';
import { RevelatorAnalyticsPeriod } from './revelator-analytics.interface';

const getAnalytics: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const period = (req.query.period as RevelatorAnalyticsPeriod) || 'monthly';
    const { from, to } = req.query as { from?: string; to?: string };
    const result = await RevelatorAnalyticsService.getAnalytics(
      userId,
      period,
      from,
      to,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Revelator analytics',
      data: result,
    });
  },
);

export const RevelatorAnalyticsController = { getAnalytics };
