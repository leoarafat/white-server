/* eslint-disable @typescript-eslint/ban-ts-comment */
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import User from '../user/user.model';
import { IGenericResponse } from '../../../interfaces/paginations';
import { IUser } from '../user/user.interface';
import QueryBuilder from '../../../builder/QueryBuilder';
import { Request } from 'express';
import Admin from '../admin/admin.model';
import sendEmail from '../../../utils/sendEmail';
import { approvedEmailBody } from './clientMails/approvedEmailBody';
import { logger } from '../../../shared/logger';
import { rejectedEmailBody } from './clientMails/rejectEmailBody';

//! Its workable

const approveOrReject = async (payload: any) => {
  const { userId, approveStatus } = payload;

  try {
    const isExistUser = await User.findById(userId);
    if (!isExistUser) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (approveStatus === 'approved') {
      const result = await User.findOneAndUpdate(
        { _id: userId },
        { isApproved: approveStatus },
        { new: true, runValidators: true },
      );

      if (result) {
        const data = { user: { name: isExistUser.name, approveStatus } };

        try {
          sendEmail({
            email: isExistUser.email,
            subject:
              'Welcome To ANS Music! Your Registration Has Been Approved',
            html: approvedEmailBody(data),
          });
        } catch (error: any) {
          logger.error('Email send error:', error.message);
          throw new ApiError(500, `${error.message}`);
        }
      }
    } else {
      const data = { user: { name: isExistUser.name, approveStatus } };
      const result = await User.findOneAndUpdate(
        { _id: userId },
        { isApproved: approveStatus },
        { new: true, runValidators: true },
      );
      try {
        sendEmail({
          email: isExistUser.email,
          subject: 'Your account request is rejected!',
          html: rejectedEmailBody(data),
        });
      } catch (error: any) {
        logger.error('Email send error:', error.message);
        throw new ApiError(500, `${error.message}`);
      }
      return result;
    }
  } catch (error: any) {
    logger.error('approveOrReject error:', error.message);
    throw new ApiError(500, `Approval process failed: ${error.message}`);
  }
};
//! Add note, make terminate and lock User
const addRevenuePercent = async (payload: {
  userId: string;
  revenueRate: string;
}) => {
  const findUser = await User.findById(payload.userId);
  if (!findUser) {
    throw new ApiError(404, 'User not found');
  }
  return await User.findOneAndUpdate(
    { _id: payload.userId },
    {
      revenueRate: payload.revenueRate,
    },
    {
      new: true,
      runValidators: true,
    },
  );
};
const addNoteInUser = async (payload: { text: string; userId: string }) => {
  const { text, userId } = payload;
  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  //@ts-ignore
  isExistUser.note.push({
    note: text,
    isRead: false,
  });
  await isExistUser.save();
  return isExistUser;
};

const lockUserAccount = async (payload: { userId: string }) => {
  const { userId } = payload;

  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return await User.findOneAndUpdate(
    { _id: userId },
    {
      accountStatus: 'lock',
      isApproved: 'pending',
    },
    {
      new: true,
      runValidators: true,
    },
  );
};
const UnlockUserAccount = async (payload: { userId: string }) => {
  const { userId } = payload;

  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return await User.findOneAndUpdate(
    { _id: userId },
    {
      accountStatus: 'un-lock',
      isApproved: 'approved',
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

const verifiedUser = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IUser[]>> => {
  const userQuery = new QueryBuilder(
    User.find({
      isApproved: 'approved',
      accountStatus: { $ne: 'lock' },
    }),
    query,
  )
    .search(['name', 'email', 'clientId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return {
    meta,
    data: result,
  };
};
const PendingUser = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IUser[]>> => {
  const userQuery = new QueryBuilder(
    User.find({ isApproved: 'pending' }),
    query,
  )
    .search(['name', 'email', 'clientId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return {
    meta,
    data: result,
  };
};
const lockedUser = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IUser[]>> => {
  const userQuery = new QueryBuilder(
    User.find({ accountStatus: 'lock' }),
    query,
  )
    .search(['name', 'email', 'clientId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return {
    meta,
    data: result,
  };
};
const rejectedUser = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IUser[]>> => {
  const userQuery = new QueryBuilder(
    User.find({ isApproved: 'rejected' }),
    query,
  )
    .search(['name', 'email', 'clientId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return {
    meta,
    data: result,
  };
};
const deleteUser = async (req: Request): Promise<IUser | null> => {
  const { id } = req.params;
  const adminId = req.user?.userId;
  const isExistAdmin = await Admin.findById(adminId);
  if (!isExistAdmin) {
    throw new ApiError(404, 'Admin account not found');
  }
  const result = await User.findByIdAndDelete(id);
  return result;
};
const getSingleUser = async (id: string): Promise<IUser | null> => {
  const result = await User.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return result;
};

export const ClientService = {
  addNoteInUser,
  lockUserAccount,
  UnlockUserAccount,
  addRevenuePercent,
  approveOrReject,
  verifiedUser,
  PendingUser,
  lockedUser,
  deleteUser,
  getSingleUser,
  rejectedUser,
};
