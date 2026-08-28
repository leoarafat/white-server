/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import csv from 'csv-parser';
import ApiError from '../../../errors/ApiError';
import { Video } from '../videos/videos.model';
import User from '../user/user.model';

const parseIsrcsFromCsvBuffer = (buffer: Buffer): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const isrcs: string[] = [];
    const stream = Readable.from(buffer.toString('utf-8'));
    stream
      .pipe(csv())
      .on('data', (row: Record<string, any>) => {
        const isrc =
          row.ISRC ||
          row.isrc ||
          row.Isrc ||
          row['Isrc'] ||
          row['ISRC '] ||
          row['isrc '];
        if (isrc && String(isrc).trim() && String(isrc).trim() !== '-') {
          isrcs.push(String(isrc).trim());
        }
      })
      .on('end', () => resolve(isrcs))
      .on('error', err => reject(err));
  });
};

const transferByCsv = async (
  file: Express.Multer.File | undefined,
  toUserId: string,
) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'CSV file is required');
  }
  if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Valid toUserId is required');
  }

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Target user not found');
  }

  const isrcs = await parseIsrcsFromCsvBuffer(file.buffer);
  if (!isrcs.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'No valid ISRC found in the CSV file',
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const matched = await Video.find({ isrc: { $in: isrcs } })
      .select('_id isrc user')
      .session(session);

    const matchedIsrcs = matched.map(v => v.isrc);
    const notFound = isrcs.filter(i => !matchedIsrcs.includes(i));

    const result = await Video.updateMany(
      { isrc: { $in: matchedIsrcs } },
      { $set: { user: new mongoose.Types.ObjectId(toUserId) } },
      { session },
    );

    await session.commitTransaction();
    return {
      totalIsrcInFile: isrcs.length,
      transferred: result.modifiedCount,
      matched: matched.length,
      notFoundIsrcs: notFound,
      toUser: { _id: toUser._id, name: toUser.name, email: toUser.email },
    };
  } catch (err: any) {
    await session.abortTransaction();
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Transfer failed: ${err.message}`,
    );
  } finally {
    session.endSession();
  }
};

const getApprovedVideosByUser = async (
  userId: string,
  query: Record<string, any>,
) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Valid userId is required');
  }

  const { searchTerm, page = 1, limit = 20 } = query;
  const filter: Record<string, any> = {
    user: new mongoose.Types.ObjectId(userId),
    isApproved: 'approved',
  };

  if (searchTerm) {
    const regex = new RegExp(String(searchTerm).trim(), 'i');
    filter.$or = [{ isrc: regex }, { title: regex }, { label: regex }];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Video.find(filter)
      .select('_id title isrc label image videoId primaryArtist isApproved')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Video.countDocuments(filter),
  ]);

  return {
    data,
    meta: { page: pageNum, limit: limitNum, total },
  };
};

const transferByIds = async (
  fromUserId: string,
  toUserId: string,
  videoIds: string[],
) => {
  if (!fromUserId || !mongoose.Types.ObjectId.isValid(fromUserId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Valid fromUserId is required');
  }
  if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Valid toUserId is required');
  }
  if (fromUserId === toUserId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromUser and toUser must be different',
    );
  }
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'videoIds are required');
  }

  const invalid = videoIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalid.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid video ids: ${invalid.join(', ')}`,
    );
  }

  const [fromUser, toUser] = await Promise.all([
    User.findById(fromUserId),
    User.findById(toUserId),
  ]);
  if (!fromUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'From user not found');
  }
  if (!toUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'To user not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await Video.updateMany(
      {
        _id: { $in: videoIds.map(id => new mongoose.Types.ObjectId(id)) },
        user: new mongoose.Types.ObjectId(fromUserId),
      },
      { $set: { user: new mongoose.Types.ObjectId(toUserId) } },
      { session },
    );

    await session.commitTransaction();
    return {
      transferred: result.modifiedCount,
      requested: videoIds.length,
      fromUser: {
        _id: fromUser._id,
        name: fromUser.name,
        email: fromUser.email,
      },
      toUser: { _id: toUser._id, name: toUser.name, email: toUser.email },
    };
  } catch (err: any) {
    await session.abortTransaction();
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Transfer failed: ${err.message}`,
    );
  } finally {
    session.endSession();
  }
};

const listUsers = async (query: Record<string, any>) => {
  const { searchTerm, limit = 50 } = query;
  const filter: Record<string, any> = { role: 'user' };
  if (searchTerm) {
    const regex = new RegExp(String(searchTerm).trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  const data = await User.find(filter)
    .select('_id name email')
    .limit(Math.max(1, Number(limit)))
    .sort({ name: 1 });
  return data;
};

export const TransferOwnershipService = {
  transferByCsv,
  getApprovedVideosByUser,
  transferByIds,
  listUsers,
};
