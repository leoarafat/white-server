import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { ClaimsService } from './claim-release.service';

//! TikTokClaimRequest
const addTikTokClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.addTikTokClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Add Successful',
      data: result,
    });
  },
);
const getTikTokClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.getTikTokClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'data retrieved successful!',
      data: result && result.data,
      meta: result && result.meta,
    });
  },
);
const updateTikTokClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateTikTokClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
//! ArtistChannelRequest
const addArtistChannelRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.addArtistChannelRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Add Successful',
      data: result,
    });
  },
);
const getArtistChannelRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.getArtistChannelRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'data retrieved successful!',
      data: result && result.data,
      meta: result && result.meta,
    });
  },
);
const updateArtistChannelRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateArtistChannelRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
//! YoutubeManualClaim
const addYoutubeManualClaim = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.addYoutubeManualClaim(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Add Successful',
      data: result,
    });
  },
);
const getYoutubeManualClaim = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.getYoutubeManualClaim(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'data retrieved successful!',
      data: result && result.data,
      meta: result && result.meta,
    });
  },
);
const updateYoutubeManualClaim = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateYoutubeManualClaim(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
//! YoutubeTakeDown
const addYoutubeTakeDown = catchAsync(async (req: Request, res: Response) => {
  const result = await ClaimsService.addYoutubeTakeDown(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Add Successful',
    data: result,
  });
});
const getYoutubeTakeDown = catchAsync(async (req: Request, res: Response) => {
  const result = await ClaimsService.getYoutubeTakeDown(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'data retrieved successful!',
    data: result && result.data,
    meta: result && result.meta,
  });
});
const updateYoutubeTakeDown = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateYoutubeTakeDown(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
//! YoutubeClaimRequest
const addYoutubeClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.addYoutubeClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Add Successful',
      data: result,
    });
  },
);
const getYoutubeClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.getYoutubeClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'data retrieved successful!',
      data: result && result.data,
      meta: result && result.meta,
    });
  },
);
const updateYoutubeClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateYoutubeClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
//! FacebookWhitelistRequest
const addFacebookWhitelistRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.addFacebookWhitelistRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Add Successful',
      data: result,
    });
  },
);
const getFacebookWhitelistRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.getFacebookWhitelistRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'data retrieved successful!',
      data: result && result.data,
      meta: result && result.meta,
    });
  },
);
const updateFacebookWhitelistRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateFacebookWhitelistRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
//! FacebookClaimRequest
const addFacebookClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.addFacebookClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Add Successful',
      data: result,
    });
  },
);
const getFacebookClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.getFacebookClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'data retrieved successful!',
      data: result && result.data,
      meta: result && result.meta,
    });
  },
);
const updateFacebookClaimRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateFacebookClaimRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
//! WhitelistRequest
const addWhitelistRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ClaimsService.addWhitelistRequest(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Add Successful',
    data: result,
  });
});
const getWhitelistRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ClaimsService.getWhitelistRequest(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'data retrieved successful!',
    data: result && result.data,
    meta: result && result.meta,
  });
});
const updateWhitelistRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClaimsService.updateWhitelistRequest(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Update successful!',
      data: result,
    });
  },
);
export const ClaimsController = {
  addTikTokClaimRequest,
  getTikTokClaimRequest,
  updateTikTokClaimRequest,
  addArtistChannelRequest,
  getArtistChannelRequest,
  updateArtistChannelRequest,
  addYoutubeManualClaim,
  getYoutubeManualClaim,
  updateYoutubeManualClaim,
  addYoutubeTakeDown,
  getYoutubeTakeDown,
  updateYoutubeTakeDown,
  addYoutubeClaimRequest,
  getYoutubeClaimRequest,
  updateYoutubeClaimRequest,
  addFacebookWhitelistRequest,
  getFacebookWhitelistRequest,
  updateFacebookWhitelistRequest,
  addFacebookClaimRequest,
  getFacebookClaimRequest,
  updateFacebookClaimRequest,
  addWhitelistRequest,
  getWhitelistRequest,
  updateWhitelistRequest,
};
