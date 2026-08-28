/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import QueryBuilder from '../../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import sendEmail from '../../../utils/sendEmail';
import { generateArtistId } from '../../../utils/uniqueId';
import { channelApproveEmailBody } from './channel.mail';
import { CustomRequest, IChannel } from './vevo-channel.interface';
import { Channel } from './vevo-channel.model';
import { logger } from '../../../shared/logger';
import { EditRequestEmailBody } from './EditRequestEmailBody';
import CustomQueryBuilder from '../../../builder/CustomQueryBuilder';
import { Types } from 'mongoose';
import User from '../user/user.model';
import { notifyAdminsOfSubmission } from '../notifications/notification.hooks';
import { OwnerContext } from '../../../shared/subUserAccess';

const addChannel = async (owner: OwnerContext, payload: IChannel) => {
  payload.channelId = generateArtistId();
  // Created directly in the master's catalog (see label.service.ts addLabel
  // for the same reasoning) — never a private entity of the sub-user.
  const result = await Channel.create({ ...payload, user: owner.ownerId });

  if (owner.isSubUser) {
    await User.updateOne(
      { user: owner.ownerId, assignedChannels: { $ne: result._id } },
      { $push: { assignedChannels: result._id } },
    );
  }

  notifyAdminsOfSubmission({
    entityType: 'vevo-channel',
    entityId: result._id.toString(),
    entityName: result.channelName,
  }).catch(() => undefined);

  return result;
};
const updateChannel = async (id: string, owner: OwnerContext, payload: any) => {
  const checkIsExist = await Channel.findById(id);
  if (!checkIsExist) {
    throw new ApiError(404, 'Channel not found');
  }
  if (String(checkIsExist.user) !== owner.ownerId) {
    throw new ApiError(403, 'You cannot edit this channel');
  }
  const { ...artistData } = payload;
  return await Channel.findOneAndUpdate({ _id: id }, artistData, {
    new: true,
    runValidators: true,
  });
};
const getChannel = async (
  owner: OwnerContext,
  query: Record<string, unknown>,
) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const baseFilter: Record<string, unknown> = { user: owner.ownerId };
  if (owner.isSubUser) {
    baseFilter._id = { $in: owner.assignedChannels };
  }
  const artistQuery = new QueryBuilder(
    Channel.find(baseFilter).lean().populate('user'),
    query,
  )
    .search(
      ['channelName'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )

    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await artistQuery.modelQuery;
  const meta = await artistQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getApprovedChannel = async (
  owner: OwnerContext,
  query: Record<string, unknown>,
) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const baseFilter: Record<string, unknown> = {
    isApproved: 'approved',
    user: owner.ownerId,
  };
  if (owner.isSubUser) {
    baseFilter._id = { $in: owner.assignedChannels };
  }
  const artistQuery = new CustomQueryBuilder(
    Channel.find(baseFilter).lean().populate('user'),
    query,
  )
    .search(
      ['channelName'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await artistQuery.modelQuery;
  const meta = await artistQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const deleteChannel = async (
  id: string,
  owner: OwnerContext | null, // null = admin/super-admin, who may delete any channel
) => {
  const isExist = await Channel.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'channel not found');
  }
  if (owner && String(isExist.user) !== owner.ownerId) {
    throw new ApiError(403, 'You cannot delete this channel');
  }
  return await Channel.findByIdAndDelete(id);
};
const getChannelByIds = async (payload: any) => {
  const { ids } = payload;

  const result = await Channel.find({ _id: { $in: ids } });
  return result;
};
const getFeatureChannelByIds = async (payload: { ids: string[] }) => {
  const { ids } = payload;

  const result = await Channel.find({ _id: { $in: ids } });
  return result;
};

const updateVevoChannel = async (id: string, payload: any) => {
  const checkIsExist = await Channel.findById(id).populate('user');
  if (!checkIsExist) {
    throw new ApiError(404, 'Channel not found');
  }
  const { ...ChannelData } = payload;

  const result = await Channel.findOneAndUpdate({ _id: id }, ChannelData, {
    new: true,
    runValidators: true,
  });
  if (ChannelData.isApproved === 'approved' && result) {
    try {
      sendEmail({
        //@ts-ignore
        email: checkIsExist?.user?.email,
        subject: ' Congratulations! Your VEVO Channel Has Been Approved',
        html: channelApproveEmailBody(checkIsExist),
      });
    } catch (error: any) {
      throw new ApiError(500, `${error.message}`);
    }
  }
  return result;
};
const getPendingVevoChannel = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const ChannelQuery = new QueryBuilder(
    Channel.find({ isApproved: 'pending' }).lean().populate('user'),
    query,
  )
    .search(
      ['channelName'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ChannelQuery.modelQuery;
  const meta = await ChannelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getApprovedVevoChannel = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const ChannelQuery = new QueryBuilder(
    Channel.find({ isApproved: 'approved' }).lean().populate('user'),
    query,
  )
    .search(
      ['channelName'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ChannelQuery.modelQuery;
  const meta = await ChannelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getRejectedVevoChannel = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const ChannelQuery = new QueryBuilder(
    Channel.find({ isApproved: 'rejected' }).lean().populate('user'),
    query,
  )
    .search(
      ['channelName'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ChannelQuery.modelQuery;
  const meta = await ChannelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const deleteVevoChannel = async (id: string) => {
  const isExist = await Channel.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'Channel not found');
  }
  return await Channel.findByIdAndDelete(id);
};
const channelUpdateRequest = async (req: Request) => {
  //@ts-ignore
  const { files } = req;
  const id = req.body?.id;

  const keywords = req.body?.keywords;
  const description = req.body?.description;
  const isKids = Boolean(req.body?.isForKids);

  const data = {
    keywords: keywords && JSON.parse(keywords),
    description,
    isKids,
    isEditApproved: 'pending',
  };

  const isExistChannel = await Channel.findById(id);
  if (!isExistChannel) {
    throw new ApiError(404, 'Channel not found');
  }
  const { ...ChannelData } = data;

  const updatedChannelData = { ...ChannelData };

  //@ts-ignore
  if (files && files.avatar) {
    //@ts-ignore
    updatedChannelData.avatar = `${files.avatar[0].location}`;
  }

  //@ts-ignore
  if (files && files.banner) {
    //@ts-ignore
    updatedChannelData.banner = `${files.banner[0].location}`;
  }

  if (!data) {
    throw new Error('Data is missing in the request body!');
  }

  const result = await Channel.findOneAndUpdate(
    { _id: id },
    { ...updatedChannelData },
    {
      new: true,
    },
  );
  if (result) {
    try {
      sendEmail({
        //@ts-ignore
        email: 'support@ansmusiclimited.com',
        subject: ' You have received a channel edit request',
        html: EditRequestEmailBody(updatedChannelData),
      });
    } catch (error: any) {
      throw new ApiError(500, `${error.message}`);
    }
  }
  return result;
};
const updateEditRequest = async (req: CustomRequest): Promise<any> => {
  try {
    const { id } = req.body;
    if (!id) {
      throw new ApiError(400, 'Channel ID is required');
    }

    const {
      keywords,
      description,
      isKids,
      channelAppleId,
      channelFacebookId,
      channelInstagramId,
      channelSpotifyId,
      channelName,
      isApproved,
      isEditApproved,
      youtubeLink,
      vevoChannel,
    } = req.body;

    let parsedKeywords: string[] = [];
    if (keywords) {
      try {
        parsedKeywords = JSON.parse(keywords);
        if (!Array.isArray(parsedKeywords)) {
          throw new Error('Keywords should be an array');
        }
      } catch (err) {
        throw new ApiError(
          400,
          'Invalid format for keywords. It should be a JSON array.',
        );
      }
    }

    const isKidsBoolean = isKids === 'true';

    const updateData: Partial<{
      keywords: string[];
      description: string;
      isKids: boolean;
      isEditApproved: string;
      channelAppleId: string;
      channelFacebookId: string;
      channelInstagramId: string;
      channelSpotifyId: string;
      channelName: string;
      isApproved: string;
      youtubeLink: string;
      vevoChannel: string;
      avatar: string;
      banner: string;
    }> = {
      ...(keywords && { keywords: parsedKeywords }),
      ...(description && { description }),
      ...(typeof isKids !== 'undefined' && { isKids: isKidsBoolean }),
      ...(isEditApproved && { isEditApproved }),
      ...(channelAppleId && { channelAppleId }),
      ...(channelFacebookId && { channelFacebookId }),
      ...(channelInstagramId && { channelInstagramId }),
      ...(channelSpotifyId && { channelSpotifyId }),
      ...(channelName && { channelName }),
      ...(isApproved && { isApproved }),
      ...(youtubeLink && { youtubeLink }),
      ...(vevoChannel && { vevoChannel }),
    };

    if (req.files?.avatar && req.files.avatar.length > 0) {
      const avatarFile = req.files.avatar[0];
      updateData.avatar = avatarFile.location;
    }

    if (req.files?.banner && req.files.banner.length > 0) {
      const bannerFile = req.files.banner[0];
      updateData.banner = bannerFile.location;
    }

    const existingChannel = await Channel.findById(id);
    if (!existingChannel) {
      throw new ApiError(404, 'Channel not found');
    }

    const updatedChannel = await Channel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return updatedChannel;
  } catch (error) {
    logger.error('Error updating channel:', error);

    throw error;
  }
};

const singleChannel = async (id: string) => {
  return await Channel.findById(id);
};
const editRequestPending = async (query: Record<string, unknown>) => {
  const ChannelQuery = new QueryBuilder(
    Channel.find({ isEditApproved: { $exists: true, $ne: null } })
      .lean()
      .populate('user'),
    query,
  )
    .search(['channelName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ChannelQuery.modelQuery;
  const meta = await ChannelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const approveEditRequest = async (req: Request) => {
  const { id } = req.params;
  const isExist = await Channel.findById(id);

  if (!isExist) {
    throw new ApiError(404, 'Channel not found');
  }
  return await Channel.findByIdAndUpdate(
    id,
    { isEditApproved: 'approved' },
    {
      new: true,
      runValidators: true,
    },
  );
};
export const channelService = {
  addChannel,
  updateChannel,
  getChannel,
  deleteChannel,
  getChannelByIds,
  getFeatureChannelByIds,
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
};
