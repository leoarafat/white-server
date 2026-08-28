/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import ejs from 'ejs';
import ApiError from '../../../errors/ApiError';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import sendEmail from '../../../utils/sendEmail';
import { Request } from 'express';
import {
  IActivationRequest,
  IActivationToken,
  IRegistration,
  IUser,
} from '../user/user.interface';
import {
  IChangePassword,
  ILoginUser,
  ILoginResult,
} from '../auth/auth.interface';
import User from '../user/user.model';

//!
const registrationSubUser = async (payload: IRegistration) => {
  const { name, email, password } = payload;
  const user = {
    name,
    email,
    password,
  };

  const isEmailExist = await User.findOne({ email });
  if (isEmailExist) {
    throw new ApiError(400, 'Email already exist');
  }
  //@ts-ignore

  const activationToken = createActivationToken(user);
  const activationCode = activationToken.activationCode;
  const data = { user: { name: user.name }, activationCode };
  await ejs.renderFile(
    path.join(__dirname, '../../../mails/activation-mail.ejs'),
    data,
  );
  try {
    sendEmail({
      email: user.email,
      subject: 'Activate Your Account',
      html: 'Test',
    });
  } catch (error: any) {
    throw new ApiError(500, `${error.message}`);
  }
  return {
    activationToken: activationToken.token,
    user,
  };
};
//!
const createActivationToken = (user: IRegistration): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    config.activation_secret as Secret,
    {
      expiresIn: '5m',
    },
  );
  return { token, activationCode };
};
//!
const activateUser = async (payload: IActivationRequest) => {
  const { activation_code, activation_token } = payload;
  const newUser: { user: IUser; activationCode: string } = jwt.verify(
    activation_token,
    config.activation_secret as string,
  ) as { user: IUser; activationCode: string };
  if (newUser.activationCode !== activation_code) {
    throw new ApiError(400, 'Activation code is not valid');
  }
  const { name, email, password } = newUser.user;
  const existUser = await User.findOne({ email });
  if (existUser) {
    throw new ApiError(400, 'Email is already exist');
  }
  const user = await User.create({
    name,
    email,
    password,
  });
  return {
    subjectId: String(user._id),
    role: user.role,
    isVerified: false,
    twoFactorEnabled: false,
  };
};
// A target account may only be read/edited by itself or by the master
// account it belongs to (its `user` field) — never by an unrelated account.
const isOwnAccountOrMaster = (target: IUser & { _id: unknown }, requesterId: string) =>
  String(target._id) === requesterId ||
  (!!target.user && String(target.user) === requesterId);

//!
const getAllUsers = async (requesterId: string): Promise<IUser[]> => {
  const users = await User.find({ user: requesterId });
  return users;
};
//!
const getSingleUser = async (
  id: string,
  requesterId: string,
): Promise<IUser | null> => {
  const result = await User.findById(id);
  if (!result) {
    throw new ApiError(404, 'User not found');
  }
  if (!isOwnAccountOrMaster(result, requesterId)) {
    throw new ApiError(403, 'You cannot view this account');
  }
  return result;
};
// Fields a profile-update call may touch. Deliberately excludes password,
// role, permission, revenueRate, balance, isApproved, assignedLabels/
// Artists/Channels, clientId, etc. — those must never be settable through a
// generic "update my profile" payload.
const PROFILE_UPDATE_FIELDS = [
  'name',
  'phoneNumber',
  'nidNumber',
  'address',
  'country',
  'state',
  'city',
  'postCode',
  'channelName',
  'channelUrl',
  'currentDistributor',
  'howHereUs',
  'subscribeCount',
  'videosCount',
] as const;
//!
const updateUser = async (
  id: string,
  req: Request,
  requesterId: string,
): Promise<IUser | null> => {
  const isExist = await User.findOne({ _id: id });
  if (!isExist) {
    throw new ApiError(404, 'User not found!');
  }
  if (!isOwnAccountOrMaster(isExist, requesterId)) {
    throw new ApiError(403, 'You cannot update this account');
  }
  const { files } = req;
  const rawData = req.body;
  const data: Record<string, unknown> = {};
  for (const key of PROFILE_UPDATE_FIELDS) {
    if (rawData[key] !== undefined) data[key] = rawData[key];
  }

  //@ts-ignore
  // const nidFrontImage = files.nidFront[0];
  let nidFrontImage = undefined;
  //@ts-ignore
  if (files && files?.nidFront) {
    //@ts-ignore
    nidFrontImage = files?.nidFront[0].path;
  }
  //@ts-ignore
  // const nidBackImage = files.nidBack[0];
  let nidBackImage = undefined;
  //@ts-ignore
  if (files && files?.nidBack) {
    //@ts-ignore
    nidBackImage = files?.nidBack[0].path;
  }
  //@ts-ignore
  // const imageFile = files.image[0];
  let imageFile = undefined;
  //@ts-ignore
  if (files && files?.image) {
    //@ts-ignore
    imageFile = `/images/image/${files?.image[0].filename}`;
  }
  //@ts-ignore
  // const copyrightNoticeImageFile = files.copyrightNoticeImage[0];
  let copyrightNoticeImageFile = undefined;
  //@ts-ignore
  if (files && files?.copyrightNoticeImage) {
    //@ts-ignore
    copyrightNoticeImageFile = files?.copyrightNoticeImage[0].path;
  }
  //@ts-ignore
  // const dashboardScreenShotFile = files.dashboardScreenShot[0];
  let dashboardScreenShotFile = undefined;
  //@ts-ignore
  if (files && files?.dashboardScreenShot) {
    //@ts-ignore
    dashboardScreenShotFile = files?.dashboardScreenShot[0].path;
  }
  const result = await User.findOneAndUpdate(
    { _id: id },
    {
      ...data,
      image: imageFile,
      nidFront: nidFrontImage,
      nidBack: nidBackImage,
      copyrightNoticeImage: copyrightNoticeImageFile,
      dashboardScreenShot: dashboardScreenShotFile,
    },
    {
      new: true,
    },
  );
  if (result) {
    const isComplete =
      Boolean(result.name) &&
      Boolean(result.email) &&
      Boolean(result.phoneNumber) &&
      Boolean(result.address) &&
      Boolean(result.image) &&
      Boolean(result.nidFront) &&
      Boolean(result.nidBack) &&
      Boolean(result.country) &&
      Boolean(result.state) &&
      Boolean(result.city) &&
      Boolean(result.postCode) &&
      Boolean(result.channelName) &&
      Boolean(result.channelUrl) &&
      Boolean(result.subscribeCount) &&
      Boolean(result.videosCount);

    //@ts-ignore
    result.isVerified = isComplete;
    if (result.isVerified == false) {
      throw new ApiError(
        500,
        'Verify failed. Please provide all the required data',
      );
    }
    await result.save();
  }
  return result;
};
//!
const deleteUser = async (
  id: string,
  requesterId: string,
): Promise<IUser | null> => {
  const target = await User.findById(id);
  if (!target) {
    throw new ApiError(404, 'User not found');
  }
  // Only a master may delete its own sub-user — never any other account,
  // and never a master/admin account through this endpoint.
  if (target.role !== 'sub-user' || String(target.user) !== requesterId) {
    throw new ApiError(403, 'You can only delete your own sub-users');
  }
  const result = await User.findByIdAndDelete(id);

  return result;
};
//!
const login = async (payload: ILoginUser): Promise<ILoginResult> => {
  const { email, password } = payload;

  const isUserExist = await User.isUserExist(email);

  if (!isUserExist) {
    throw new ApiError(404, 'SUb User does not exist');
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
    twoFactorEnabled: false,
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
  const { oldPassword } = payload;
  const isUserExist = await User.findOne({ _id: user?.userId }).select(
    '+password',
  );
  if (!isUserExist) {
    throw new ApiError(404, 'User does not exist');
  }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(402, 'Old password is incorrect');
  }

  isUserExist.save();
};
export const SubUserService = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  registrationSubUser,
  activateUser,
  login,
  resolveUserForRefresh,
  changePassword,
};
