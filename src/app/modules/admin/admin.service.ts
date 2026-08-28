/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import ApiError from '../../../errors/ApiError';
import {
  IChangePassword,
  ILoginUser,
  ILoginResult,
} from '../auth/auth.interface';
import { IRegistration, IUser } from '../user/user.interface';
import User from '../user/user.model';
import Admin from './admin.model';
import httpStatus from 'http-status';
import QueryBuilder from '../../../builder/QueryBuilder';
import { IGenericResponse } from '../../../interfaces/paginations';
import { IAdmin } from './admin.interface';
import { IReqUser } from '../../../interfaces/common';
import { Request } from 'express';
import { generateArtistId } from '../../../utils/uniqueId';

//!
const registerAdmin = async (payload: IRegistration) => {
  const { email } = payload;
  const isEmailExist = await Admin.findOne({ email });
  if (isEmailExist) {
    throw new ApiError(400, 'Email already exist');
  }
  payload.role = 'admin';
  return await Admin.create(payload);
};
//!
const createUser = async (userData: IUser): Promise<IUser | null> => {
  userData.isApproved = 'approved';
  //@ts-ignore
  userData.isVerified = true;
  const clientId = generateArtistId();
  userData.clientId = clientId.toString();

  const newUser = await User.create(userData);
  return newUser;
};
//!
const getAllUsers = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IUser[]>> => {
  const userQuery = new QueryBuilder(User.find(), query)
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
//!
const getSingleUser = async (id: string): Promise<IUser | null> => {
  const result = await User.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return result;
};
const deleteAdmin = async (id: string): Promise<IUser | null> => {
  const result = await Admin.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return await Admin.findByIdAndDelete(id);
};
const getAllAdmin = async () => {
  const results = await Admin.find({ role: 'admin' }).lean();

  return results;
};

//!
const updateAdmin = async (req: Request): Promise<IAdmin | null> => {
  const user = req.user as IReqUser;

  //@ts-ignore
  const { files } = req;
  //@ts-ignore
  if (files?.image?.length) {
    const result = await Admin.findOneAndUpdate(
      { _id: user?.userId },
      //@ts-ignore
      { image: `${files.image[0].location}` },
      {
        new: true,
        runValidators: true,
      },
    );

    return result;
  } else {
    //@ts-ignore
    const data = req.body;
    if (!data) {
      throw new Error('Data is missing in the request body!');
    }

    const isExist = await Admin.findOne({ _id: user?.userId });

    if (!isExist) {
      throw new ApiError(404, 'Admin not found !');
    }

    const { ...AdminData } = data;

    const updatedAdminData: Partial<IAdmin> = { ...AdminData };

    const result = await Admin.findOneAndUpdate(
      { _id: user?.userId },
      updatedAdminData,
      {
        new: true,
      },
    );
    return result;
  }
};

//!
const deleteUser = async (id: string): Promise<IUser | null> => {
  const result = await User.findByIdAndDelete(id);

  return result;
};
//!
const login = async (payload: ILoginUser): Promise<ILoginResult> => {
  const { email, password } = payload;

  const isUserExist = await Admin.isAdminExist(email);

  if (!isUserExist) {
    throw new ApiError(404, 'Admin does not exist');
  }

  if (
    isUserExist.password &&
    !(await Admin.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(402, 'Password is incorrect');
  }

  const fullAdmin = await Admin.findById(isUserExist._id).lean();

  return {
    subjectId: String(isUserExist._id),
    role: isUserExist.role,
    twoFactorEnabled: Boolean(fullAdmin?.twoFactor?.enabled),
  };
};

// Resolver used by the cookie refresh-token rotation flow.
const resolveAdminForRefresh = async (subjectId: string) => {
  const admin = await Admin.findById(subjectId).lean();
  if (!admin) return null;
  return { role: admin.role };
};

const changePassword = async (
  user: IReqUser,
  payload: IChangePassword,
): Promise<void> => {
  const { oldPassword, confirmPassword, newPassword } = payload;

  const isUserExist = await Admin.findOne({ _id: user?.userId }).select(
    '+password',
  );

  if (!isUserExist) {
    throw new ApiError(404, 'Admin does not exist');
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New and confirm password doesn't match",
    );
  }
  if (
    isUserExist.password &&
    !(await Admin.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(402, 'Old password is incorrect');
  }
  isUserExist.password = newPassword;
  await isUserExist.save();
};
const myProfile = async (user: IReqUser) => {
  return await Admin.findById(user?.userId).lean();
};
const updateUserProfile = async (req: Request): Promise<IUser | null> => {
  const { id: userId } = req.params;
  const data = req.body;
  if (!data) {
    throw new Error('Data is missing in the request body!');
  }

  const isExist = await User.findOne({ _id: userId });

  if (!isExist) {
    throw new ApiError(404, 'User not found !');
  }

  const { ...UserData } = data;

  const updatedUserData: Partial<IUser> = { ...UserData };

  const result = await User.findOneAndUpdate({ _id: userId }, updatedUserData, {
    new: true,
    runValidators: true,
  });
  return result;
};
export const AdminService = {
  createUser,
  getAllUsers,
  getSingleUser,
  deleteUser,
  registerAdmin,
  login,
  changePassword,
  resolveAdminForRefresh,
  updateAdmin,
  myProfile,
  getAllAdmin,
  deleteAdmin,
  updateUserProfile,
};
