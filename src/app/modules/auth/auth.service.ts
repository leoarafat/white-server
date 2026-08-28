/* eslint-disable @typescript-eslint/ban-ts-comment */
import { JwtPayload } from 'jsonwebtoken';
import config from '../../../config';
import bcrypt from 'bcrypt';
import {
  IChangePassword,
  ILoginUser,
  ILoginResult,
} from './auth.interface';
import User from '../user/user.model';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';

import { sendEmail } from './sendResetMails';

const loginUser = async (payload: ILoginUser): Promise<ILoginResult> => {
  const { email, password } = payload;

  const isUserExist = await User.isUserExist(email);
  //@ts-ignore
  if (isUserExist?.accountStatus === 'lock') {
    throw new ApiError(
      400,
      'Your account is locked! Please contact with ANS Music Help Center',
    );
  }
  const newUser = await User.findOne({ email });
  if (!isUserExist) {
    throw new ApiError(404, 'User does not exist');
  }

  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(402, 'Password is incorrect');
  }

  return {
    subjectId: String(isUserExist._id),
    role: isUserExist.role,
    isVerified: newUser?.isVerified,
    twoFactorEnabled: Boolean(newUser?.twoFactor?.enabled),
  };
};

// Resolver used by the cookie refresh-token rotation flow.
const resolveUserForRefresh = async (subjectId: string) => {
  const user = await User.findById(subjectId).lean();
  if (!user) return null;
  return { role: user.role, extraAccessClaims: { isVerified: user.isVerified } };
};

const changePassword = async (
  user: JwtPayload | null,
  payload: IChangePassword,
): Promise<void> => {
  //@ts-ignore
  const { userId, oldPassword, newPassword } = payload;
  const isUserExist = await User.findOne({ _id: userId }).select('+password');
  if (!isUserExist) {
    throw new ApiError(404, 'User does not exist');
  }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(402, 'Old password is incorrect');
  }
  isUserExist.password = newPassword;
  isUserExist.save();
};
//!
const forgotPass = async (payload: { email: string }) => {
  const user = await User.findOne(
    { email: payload.email },
    { _id: 1, role: 1, name: 1 },
  );

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist!');
  }

  const passResetToken = await jwtHelpers.createResetToken(
    { _id: user.id },
    config.jwt.secret as string,
    '50m',
  );

  // const resetLink: string = config.resetlink + `token=${passResetToken}`;
  const resetLink: string = `${config.resetlink}token=${passResetToken}&email=${payload.email}`;
  sendEmail(
    payload.email,
    `
      <div>
        <p>Hi, ${user?.name}</p>
        <p>Your password reset link: <a href=${resetLink}>Click Here</a></p>
        <p>Thank you</p>
      </div>
  `,
  );
};

const resetPassword = async (
  payload: { email: string; newPassword: string },
  token: string,
) => {
  const { email, newPassword } = payload;
  const user = await User.findOne({ email }, { _id: 1 });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found!');
  }

  await jwtHelpers.verifyToken(token, config.jwt.secret as string);

  const password = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await User.updateOne({ email }, { password });
};
export const AuthService = {
  loginUser,
  resolveUserForRefresh,
  changePassword,
  forgotPass,
  resetPassword,
};
