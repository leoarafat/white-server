/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import ApiError from '../../../errors/ApiError';
import {
  ArtistChannelRequest,
  FacebookClaimRequest,
  FacebookWhitelistRequest,
  TikTokClaimRequest,
  WhitelistRequest,
  YoutubeClaimRequest,
  YoutubeManualClaim,
  YoutubeTakeDown,
} from './claim-release.model';
import { IReqUser } from '../../../interfaces/common';
import { ENUM_USER_ROLE } from '../../../enums/user';
import QueryBuilder from '../../../builder/QueryBuilder';
import sendEmail from '../../../utils/sendEmail';
import { claimRequestEmailBody } from './claims.emai';

//! TikTok Claim Request
const addTikTokClaimRequest = async (req: Request) => {
  const payload = req.body;

  const result = await TikTokClaimRequest.create(payload);

  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getTikTokClaimRequest = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      TikTokClaimRequest.find({ user: userId }).populate('user'),
      query,
    )
      .search(['songTitle'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(TikTokClaimRequest.find({}), query)
      .search(['songTitle', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};
const updateTikTokClaimRequest = async (req: Request) => {
  const { id } = req.params;
  const isExist = await TikTokClaimRequest.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'Claim not found');
  }
  const payload: { approvedStatus: string } = req.body;
  const result = await TikTokClaimRequest.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};

//! ArtistChannelRequest
const addArtistChannelRequest = async (req: Request) => {
  const payload = req.body;

  const result = await ArtistChannelRequest.create(payload);
  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getArtistChannelRequest = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      ArtistChannelRequest.find({ user: userId }).populate('user'),
      query,
    )
      .search(['channel_link'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(
      ArtistChannelRequest.find({}).populate('user'),
      query,
    )
      .search(['channel_link'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;

    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};

const updateArtistChannelRequest = async (req: Request) => {
  const { id } = req.params;

  const isExist = await ArtistChannelRequest.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'not found');
  }
  const payload: { approvedStatus: string } = req.body;

  const result = await ArtistChannelRequest.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};
//! YoutubeManualClaim
const addYoutubeManualClaim = async (req: Request) => {
  const payload = req.body;

  const result = await YoutubeManualClaim.create(payload);
  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getYoutubeManualClaim = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      YoutubeManualClaim.find({ user: userId }).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(
      YoutubeManualClaim.find({}).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};
const updateYoutubeManualClaim = async (req: Request) => {
  const { id } = req.params;
  const isExist = await YoutubeManualClaim.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'not found');
  }
  const payload: { approvedStatus: string } = req.body;
  const result = await YoutubeManualClaim.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};
//! YoutubeTakeDown
const addYoutubeTakeDown = async (req: Request) => {
  const payload = req.body;

  const result = await YoutubeTakeDown.create(payload);
  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getYoutubeTakeDown = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      YoutubeTakeDown.find({ user: userId }).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(
      YoutubeTakeDown.find({}).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};
const updateYoutubeTakeDown = async (req: Request) => {
  const { id } = req.params;
  const isExist = await YoutubeTakeDown.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'not found');
  }
  const payload: { approvedStatus: string } = req.body;
  const result = await YoutubeTakeDown.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};
//! YoutubeClaimRequest
const addYoutubeClaimRequest = async (req: Request) => {
  const payload = req.body;

  const result = await YoutubeClaimRequest.create(payload);
  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getYoutubeClaimRequest = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      YoutubeClaimRequest.find({ user: userId }).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(
      YoutubeClaimRequest.find({}).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};
const updateYoutubeClaimRequest = async (req: Request) => {
  const { id } = req.params;
  const isExist = await YoutubeClaimRequest.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'not found');
  }
  const payload: { approvedStatus: string } = req.body;
  const result = await YoutubeClaimRequest.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};
//! FacebookWhitelistRequest
const addFacebookWhitelistRequest = async (req: Request) => {
  const payload = req.body;

  const result = await FacebookWhitelistRequest.create(payload);
  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getFacebookWhitelistRequest = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      FacebookWhitelistRequest.find({ user: userId }).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(
      FacebookWhitelistRequest.find({}).populate('user'),
      query,
    )
      .search(['labelName', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};
const updateFacebookWhitelistRequest = async (req: Request) => {
  const { id } = req.params;
  const isExist = await FacebookWhitelistRequest.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'not found');
  }
  const payload: { approvedStatus: string } = req.body;
  const result = await FacebookWhitelistRequest.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};
//! FacebookClaimRequest
const addFacebookClaimRequest = async (req: Request) => {
  const payload = req.body;

  const result = await FacebookClaimRequest.create(payload);
  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getFacebookClaimRequest = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      FacebookClaimRequest.find({ user: userId }).populate('user'),
      query,
    )
      .search(['songTitle', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(
      FacebookClaimRequest.find({}).populate('user'),
      query,
    )
      .search(['songTitle', 'email'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};
const updateFacebookClaimRequest = async (req: Request) => {
  const { id } = req.params;
  const isExist = await FacebookClaimRequest.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'not found');
  }
  const payload: { approvedStatus: string } = req.body;
  const result = await FacebookClaimRequest.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};
//! WhitelistRequest
const addWhitelistRequest = async (req: Request) => {
  const payload = req.body;

  const result = await WhitelistRequest.create(payload);
  if (result) {
    try {
      sendEmail({
        email: 'support@ansmusiclimited.com',
        subject: 'New Email Received',
        //@ts-ignore
        html: claimRequestEmailBody(),
      });
    } catch (error: any) {
      throw new ApiError(500, `Email sending failed: ${error.message}`);
    }
  }
  return result;
};
const getWhitelistRequest = async (req: Request) => {
  const { role, userId } = req.user as IReqUser;

  const query = req.query;

  if (role === 'user' || role === 'sub-user') {
    const requestQuery = new QueryBuilder(
      WhitelistRequest.find({ user: userId }).populate('user'),
      query,
    )
      .search(['url'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  } else if (
    role === ENUM_USER_ROLE.ADMIN ||
    role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    const requestQuery = new QueryBuilder(
      WhitelistRequest.find({}).populate('user'),
      query,
    )
      .search(['url'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await requestQuery.modelQuery;
    const meta = await requestQuery.countTotal();

    return {
      meta,
      data: result,
    };
  }
};
const updateWhitelistRequest = async (req: Request) => {
  const { id } = req.params;
  const isExist = await WhitelistRequest.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'not found');
  }
  const payload: { approvedStatus: string } = req.body;
  const result = await WhitelistRequest.findByIdAndUpdate(
    id,
    { approvedStatus: payload.approvedStatus },
    { new: true, runValidators: true },
  );
  return result;
};
export const ClaimsService = {
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
