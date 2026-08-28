import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { StaticsService } from './statics.service';

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.insertIntoDB(req as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'File Uploaded Successful',
    data: result,
  });
});
const UploadStreamFile = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.UploadStreamFile(req as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Statics Uploaded Successful',
    data: result,
  });
});
const generateAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.generateAnalytics(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Statics Retrieved Successful',
    data: result,
  });
});
const vevoAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.vevoAnalytics(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Statics Retrieved Successful',
    data: result,
  });
});
const topArtistAndLabelAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.topArtistAndLabelAnalytics(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Statics Retrieved Successful',
      data: result,
    });
  },
);
const allLabels = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.allLabels(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Label Retrieved Successful',
    data: result,
  });
});
const allSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.allSongs(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Songs Retrieved Successful',
    data: result,
  });
});
const generateAnalyticsByTractile = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.generateAnalyticsByTractile(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Statics Retrieved Successful',
      data: result,
    });
  },
);
const generateStreamsAnalyticsByLabel = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.generateStreamsAnalyticsByLabel(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Statics Retrieved Successful',
      data: result,
    });
  },
);
const generateFinancialAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.generateFinancialAnalytics(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Statics Retrieved Successful',
      data: result,
    });
  },
);
const getSubUserRevenueReport = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.getSubUserRevenueReport(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Sub-user revenue report retrieved',
      data: result,
    });
  },
);
const generateFinancialRevenueAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.generateFinancialRevenueAnalytics(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Statics Retrieved Successful',
      data: result,
    });
  },
);
const generateFinancialRevenueAnalyticsByCountry = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await StaticsService.generateFinancialRevenueAnalyticsByCountry(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Statics Retrieved Successful',
      data: result,
    });
  },
);
const getMusicGrowthData = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.getMusicGrowthData(req, res);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Statics Retrieved Successful',
    data: result,
  });
});
const getArtistAndLabelGrowthData = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.getArtistAndLabelGrowthData(req, res);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Statics Retrieved Successful',
      data: result,
    });
  },
);
const getCorrectionRequestAlbum = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.getCorrectionRequestAlbum(
      req.params.id,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: ' Successful',
      data: result,
    });
  },
);
const getCorrectionRequestSingle = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.getCorrectionRequestSingle(
      req.params.id,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: ' Successful',
      data: result,
    });
  },
);
const revenueByTitle = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.revenueByTitle(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Revenue by title retrieved successfully',
    data: result,
  });
});
const revenueByCountry = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.revenueByCountry(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Revenue by country retrieved successfully',
    data: result,
  });
});
const revenueByPlatform = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.revenueByPlatform(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Revenue by platform retrieved successfully',
    data: result,
  });
});
const getAllIsrcs = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.getAllIsrcs();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'ISRCs retrieved successfully',
    data: result,
  });
});
const getFiles = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.getFiles();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' Successful',
    data: result,
  });
});
const getMyDataFromFiles = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.getMyDataFromFiles(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' Successful',
    data: result,
  });
});
const getLatestReportPeriod = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.getLatestReportPeriod(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Latest report period retrieved',
      data: result,
    });
  },
);
const deleteFiles = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.deleteFiles(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Delete Successful',
    data: result,
  });
});
const lastSixApprovedTracks = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.lastSixApprovedTracks(req.params.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: ' Successful',
      data: result,
    });
  },
);
const lastSixApprovedLabel = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.lastSixApprovedLabel();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' Successful',
    data: result,
  });
});
const latestArtists = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.latestArtists();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' Successful',
    data: result,
  });
});
const myCurrentMonthBalance = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.myCurrentMonthBalance(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: ' Successful',
      data: result,
    });
  },
);
const myFullMonthBalance = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.myFullMonthBalance(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' Successful',
    data: result,
  });
});
const getAllTimeTotalRevenue = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaticsService.getAllTimeTotalRevenue(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: ' Successful',
      data: result,
    });
  },
);
const testFile = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.testFile();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ' Successful',
    data: result,
  });
});
const totalCounts = catchAsync(async (req: Request, res: Response) => {
  const result = await StaticsService.totalCounts(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successful',
    data: result,
  });
});
export const StaticsController = {
  insertIntoDB,
  getAllIsrcs,
  revenueByTitle,
  revenueByCountry,
  revenueByPlatform,
  generateAnalytics,
  getCorrectionRequestAlbum,
  getCorrectionRequestSingle,
  getFiles,
  lastSixApprovedTracks,
  deleteFiles,
  getLatestReportPeriod,
  generateFinancialAnalytics,
  getSubUserRevenueReport,
  getMusicGrowthData,
  getArtistAndLabelGrowthData,
  lastSixApprovedLabel,
  latestArtists,
  getMyDataFromFiles,
  getAllTimeTotalRevenue,
  myCurrentMonthBalance,
  generateFinancialRevenueAnalytics,
  myFullMonthBalance,
  generateAnalyticsByTractile,
  generateFinancialRevenueAnalyticsByCountry,
  testFile,
  totalCounts,
  UploadStreamFile,
  generateStreamsAnalyticsByLabel,
  vevoAnalytics,
  topArtistAndLabelAnalytics,
  allSongs,
  allLabels,
};
