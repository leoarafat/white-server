/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import ApiError from '../../../errors/ApiError';
import {
  IActivationRequest,
  IActivationToken,
  IRegistration,
  IUser,
} from './user.interface';
import User from './user.model';
import jwt, { Secret } from 'jsonwebtoken';
import config from '../../../config';
import sendEmail from '../../../utils/sendEmail';
import { Request } from 'express';
import {
  IChangePassword,
  ILoginUser,
  ILoginResult,
} from '../auth/auth.interface';
import { generateArtistId } from '../../../utils/uniqueId';
import QueryBuilder from '../../../builder/QueryBuilder';
import { IGenericResponse } from '../../../interfaces/paginations';
import { registrationSuccessEmailBody } from './user.mail';
import httpStatus from 'http-status';
import { IReqUser } from '../../../interfaces/common';
import { isSubUserPermissionKey } from '../../../enums/subUserPermissions';
import { Label } from '../label/label.model';
import { PrimaryArtist } from '../primary-artist/primary-artist.model';
import { Channel } from '../vevo-channel/vevo-channel.model';

//!
const registrationUser = async (payload: IRegistration) => {
  const { name, email, password, phoneNumber, role } = payload;
  const user = {
    name,
    email,
    password,
    phoneNumber,
    role,
  };

  const isEmailExist = await User.findOne({ email });
  if (isEmailExist) {
    throw new ApiError(400, 'Email already exist');
  }

  const activationToken = createActivationToken(user);
  const activationCode = activationToken.activationCode;
  const data = { user: { name: user.name }, activationCode };
  try {
    sendEmail({
      email: user.email,
      subject: ' [Urgent] Please active your ARP Music account.',
      html: registrationSuccessEmailBody(data),
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
const createSubUser = async (
  userData: IUser,
  user: IReqUser,
): Promise<IUser | null> => {
  const userId = user.userId;
  userData.user = userId;
  userData.role = 'sub-user';
  const clientId = generateArtistId();
  userData.clientId = clientId.toString();
  const isExist = await User.findOne({ _id: userId });
  if (!isExist) {
    throw new ApiError(404, 'User not found');
  }
  userData.isApproved = 'approved';
  //@ts-ignore
  userData.isVerified = true;
  //@ts-ignore
  userData.channelName = isExist?.channelName;
  if (userData.phoneNumber === '') {
    //@ts-ignore
    delete userData.phoneNumber;
  }

  const newUser = await User.create(userData);
  return newUser;
};
const mySubUser = async (req: Request) => {
  //@ts-ignore
  const userId = req.user.userId as IReqUser;

  return await User.find({ user: userId });
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
  const { name, email, password, phoneNumber } = newUser.user;

  const existUser = await User.findOne({ email });
  if (existUser) {
    throw new ApiError(400, 'Email is already exist');
  }
  const clientId = generateArtistId();
  const user = await User.create({
    name,
    email,
    password,
    clientId,
    phoneNumber,
  });

  try {
    sendEmail({
      email: 'support@ansmusiclimited.com',
      subject: 'New Client Request Arrived',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333333;">New Client Request for Approval</h2>
              <p style="color: #333333; font-size: 16px;">
                Dear Admin,
              </p>
              <p style="color: #333333; font-size: 16px;">
                You have received a new client request for approval. Please review the details below:
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px; border: 1px solid #dddddd; background-color: #f9f9f9;"><strong>Name:</strong></td>
                  <td style="padding: 10px; border: 1px solid #dddddd;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #dddddd; background-color: #f9f9f9;"><strong>Email:</strong></td>
                  <td style="padding: 10px; border: 1px solid #dddddd;">${email}</td>
                </tr>
              </table>
              <p style="color: #333333; font-size: 16px;">
                Please log in to the admin panel to review and approve the request.
              </p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error: any) {
    throw new ApiError(500, `${error.message}`);
  }

  return {
    user,
    subjectId: String(user._id),
    role: user.role,
    isVerified: false,
  };
};
//!
const createUser = async (userData: IUser): Promise<IUser | null> => {
  const newUser = await User.create(userData);

  return newUser;
};
//!
const getAllUsers = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IUser[]>> => {
  const userQuery = new QueryBuilder(User.find(), query)
    .search(['name', 'email'])
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
const getSingleUser = async (user: IReqUser): Promise<IUser | null> => {
  const result = await User.findById(user?.userId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return result;
};
const getUserById = async (
  id: string,
  requesterId: string,
): Promise<IUser | null> => {
  const result = await User.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  // Only the account itself or its own master may look it up this way —
  // previously any authenticated user/sub-user could fetch any other
  // account's full profile (incl. permissions) by guessing an id.
  const isSelf = id === requesterId;
  const isOwnSubUser = result.user && result.user.toString() === requesterId;
  if (!isSelf && !isOwnSubUser) {
    throw new ApiError(403, 'You cannot view this account');
  }
  return result;
};
//!
const updateProfilePicture = async (req: Request) => {
  //@ts-ignore
  const { files } = req;
  if (!files) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File is missing');
  }
  let image = undefined;
  //@ts-ignore
  if (files && files.image) {
    //@ts-ignore
    image = `${files.image[0].location}`;
  }

  const { userId } = req.user as IReqUser;
  const checkValidUser = await User.findById(userId);

  if (!checkValidUser) {
    throw new ApiError(404, 'You are not authorized');
  }
  return await User.findOneAndUpdate(
    { _id: userId },
    { image },
    {
      new: true,
    },
  );
};
//!

//! Verification
const profileVerification = async (req: Request): Promise<IUser | null> => {
  //@ts-ignore
  const { files } = req;

  const data = {
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    nidNumber: req.body.nidNumber,
  };

  const { userId } = req.user as IReqUser;
  const checkValidUser = await User.findById(userId);
  if (!checkValidUser) {
    throw new ApiError(404, 'You are not authorized');
  }
  let image = undefined;
  //@ts-ignore
  if (files && files.image) {
    //@ts-ignore
    image = `${files.image[0].location}`;
  }
  let nidFront = undefined;
  //@ts-ignore
  if (files && files.nidFront) {
    //@ts-ignore
    nidFront = `${files.nidFront[0].location}`;
  }
  let nidBack = undefined;
  //@ts-ignore
  if (files && files.nidBack) {
    //@ts-ignore
    nidBack = `${files.nidBack[0].location}`;
  }

  if (!data) {
    throw new Error('Data is missing in the request body!');
  }

  const isExist = await User.findOne({ _id: userId });

  if (!isExist) {
    throw new ApiError(404, 'User not found !');
  }

  const { ...UserData } = data;

  const updatedUserData: Partial<IUser> = { ...UserData };

  const result = await User.findOneAndUpdate(
    { _id: userId },
    { image, nidFront, nidBack, ...updatedUserData },
    {
      new: true,
    },
  );
  return result;
};
const labelVerification = async (req: Request): Promise<IUser | null> => {
  //@ts-ignore
  const { files } = req;
  const { userId } = req.user as IReqUser;
  const channelUrl = req.body.channelUrl;
  const channelName = req.body.channelName;
  const currentDistributor = req.body.currentDistributor;
  const howHereUs = req.body.howHereUs;
  // const subscribeCount = req.body.subscribeCount;
  const data = {
    channelName,
    channelUrl,
    currentDistributor,
    howHereUs,
  };

  const checkValidUser = await User.findById(userId);
  if (!checkValidUser) {
    throw new ApiError(404, 'You are not authorized');
  }
  const { ...UserData } = data;

  const updatedUserData: Partial<IUser> = { ...UserData };

  //@ts-ignore
  if (files && files.dashboardScreenShot) {
    //@ts-ignore
    updatedUserData.dashboardScreenShot = `${files.dashboardScreenShot[0].location}`;
  }

  //@ts-ignore
  if (files && files.copyrightNoticeImage) {
    //@ts-ignore
    updatedUserData.copyrightNoticeImage = `${files.copyrightNoticeImage[0].location}`;
  }

  if (!data) {
    throw new Error('Data is missing in the request body!');
  }

  const result = await User.findOneAndUpdate(
    { _id: userId },
    { ...updatedUserData },
    {
      new: true,
    },
  );
  return result;
};
const signatureVerification = async (req: Request): Promise<IUser | null> => {
  //@ts-ignore
  const { files } = req;
  const { userId } = req.user as IReqUser;

  const checkValidUser = await User.findById(userId);
  if (!checkValidUser) {
    throw new ApiError(404, 'You are not authorized');
  }
  let signature = undefined;
  //@ts-ignore
  if (files && files.signature) {
    //@ts-ignore
    signature = `${files.signature[0].location}`;
  }

  const result = await User.findOneAndUpdate(
    { _id: userId },
    { signature },
    {
      new: true,
    },
  );
  return result;
};
const updateProfile = async (req: Request): Promise<IUser | null> => {
  const { userId } = req.user as IReqUser;
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
const updateUser = async (req: Request): Promise<IUser | null> => {
  const { userId } = req.user as IReqUser;
  const result = await User.findOne({ _id: userId });

  if (result) {
    const isComplete =
      Boolean(result.name) &&
      Boolean(result.email) &&
      Boolean(result.country) &&
      Boolean(result.city) &&
      Boolean(result.channelName) &&
      Boolean(result.channelUrl);
    //Boolean(result.subscribeCount) &&
    //  Boolean(result.videosCount);

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
const addClientImage = async (req: Request): Promise<IUser | null> => {
  //@ts-ignore
  const { files } = req;
  const userId = req.body.id;

  const checkValidUser = await User.findById(userId);
  if (!checkValidUser) {
    throw new ApiError(404, 'User not found');
  }

  //@ts-ignore
  if (files && files.dashboardScreenShot) {
    //@ts-ignore
    checkValidUser.dashboardScreenShot = `${files.dashboardScreenShot[0].location}`;
  }

  //@ts-ignore
  if (files && files.copyrightNoticeImage) {
    //@ts-ignore
    checkValidUser.copyrightNoticeImage = `${files.copyrightNoticeImage[0].location}`;
  }
  //@ts-ignore
  if (files && files.nidBack) {
    //@ts-ignore
    checkValidUser.nidBack = `${files.nidBack[0].location}`;
  }
  //@ts-ignore
  if (files && files.nidFront) {
    //@ts-ignore
    checkValidUser.nidFront = `${files.nidFront[0].location}`;
  }
  //@ts-ignore
  if (files && files.signature) {
    //@ts-ignore
    checkValidUser.signature = `${files.signature[0].location}`;
  }
  //@ts-ignore
  if (files && files.image) {
    //@ts-ignore
    checkValidUser.image = `${files.image[0].location}`;
  }

  const result = await User.findOneAndUpdate(
    { _id: userId },
    { ...checkValidUser },
    {
      new: true,
    },
  );
  return result;
};

const deleteUser = async (id: string): Promise<IUser | null> => {
  const result = await User.findByIdAndDelete(id);

  return result;
};
//!
const loginUser = async (payload: ILoginUser): Promise<ILoginResult> => {
  const { email, password } = payload;

  const isUserExist = await User.isUserExist(email);
  const existUser = await User.findOne({ email });
  if (!isUserExist) {
    throw new ApiError(404, 'User does not exist');
  }
  if (existUser && existUser.accountStatus === 'lock') {
    throw new ApiError(500, 'Your account is locked');
  }
  if (existUser && existUser.isApproved === 'rejected') {
    throw new ApiError(400, 'Your account is locked');
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
    isVerified: existUser?.isVerified,
    twoFactorEnabled: Boolean(existUser?.twoFactor?.enabled),
  };
};
// Resolver used by the cookie refresh-token rotation flow.
const resolveUserForRefresh = async (subjectId: string) => {
  const user = await User.findById(subjectId).lean();
  if (!user) return null;
  return {
    role: user.role,
    extraAccessClaims: { isVerified: user.isVerified },
  };
};

const changePassword = async (
  user: IReqUser,
  payload: IChangePassword,
): Promise<void> => {
  const { oldPassword, confirmPassword, newPassword } = payload;

  const isUserExist = await User.findOne({ _id: user?.userId }).select(
    '+password',
  );

  if (!isUserExist) {
    throw new ApiError(404, 'User does not exist');
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New and confirm password doesn't match",
    );
  }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(402, 'Old password is incorrect');
  }
  isUserExist.password = newPassword;
  await isUserExist.save();
};
// const givePermission = async (req: Request) => {
//   const { selectedUserId, selectedPermissions } = req.body;

//   const findUser = await User.findById(selectedUserId);
//   if (!findUser) {
//     throw new ApiError(404, 'User not found');
//   }

//   selectedPermissions.forEach((data: string) => {
//     //@ts-ignore
//     const hasPermission = findUser.permission.includes(data);

//     if (!hasPermission) {
//       //@ts-ignore
//       findUser.permission.push(data);
//     }
//   });

//   await findUser.save();

//   return { success: true, message: 'Permissions updated successfully' };
// };
const givePermission = async (req: Request) => {
  const {
    selectedUserId,
    selectedPermissions,
    assignedLabels,
    assignedArtists,
    assignedChannels,
    masterShareRate,
    revenueRate,
  } = req.body;
  //@ts-ignore
  const masterId = req.user?.userId?.toString();

  const findUser = await User.findById(selectedUserId);
  if (!findUser) {
    throw new ApiError(404, 'User not found');
  }

  // Ownership check: a master account may only manage permissions/assigned
  // resources for its own sub-users, never any other account's — the old
  // implementation let any authenticated "user" overwrite ANY user's
  // permissions by id.
  if (
    findUser.role !== 'sub-user' ||
    !findUser.user ||
    findUser.user.toString() !== masterId
  ) {
    throw new ApiError(
      403,
      'You can only manage permissions for your own sub-users',
    );
  }

  if (Array.isArray(selectedPermissions)) {
    const invalid = selectedPermissions.filter(
      (p: string) => !isSubUserPermissionKey(p),
    );
    if (invalid.length) {
      throw new ApiError(400, `Unknown permission(s): ${invalid.join(', ')}`);
    }
    findUser.permission = selectedPermissions;
  }

  // Assigned resources: silently intersect with what the master actually
  // owns, so a tampered request can never assign in another user's label,
  // artist, or channel.
  if (Array.isArray(assignedLabels)) {
    const owned = await Label.find({
      _id: { $in: assignedLabels },
      user: masterId,
    }).select('_id');
    findUser.assignedLabels = owned.map(l => l._id) as any;
  }
  if (Array.isArray(assignedArtists)) {
    const owned = await PrimaryArtist.find({
      _id: { $in: assignedArtists },
      user: masterId,
    }).select('_id');
    findUser.assignedArtists = owned.map(a => a._id) as any;
  }
  if (Array.isArray(assignedChannels)) {
    const owned = await Channel.find({
      _id: { $in: assignedChannels },
      user: masterId,
    }).select('_id');
    findUser.assignedChannels = owned.map(c => c._id) as any;
  }

  // Phase 3: what % of THIS sub-user's own revenue share the master takes
  // as a cut. Clamped to [0, 100] — anything outside that range would
  // either do nothing (negative) or take more than exists (over 100).
  if (masterShareRate !== undefined) {
    const rate = Number(masterShareRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      throw new ApiError(
        400,
        'Revenue share must be a number between 0 and 100',
      );
    }
    findUser.masterShareRate = String(rate);
  }

  // What % of gross revenue THIS sub-user earns from their own catalog.
  // Normally only an admin sets this (clients.service.ts addRevenuePercent,
  // POST /clients/ad-revenue) — this lets a master set it directly for their
  // OWN sub-users too, so they don't have to go through admin for every new
  // sub-user. Admin's endpoint still works unchanged (e.g. for support
  // overrides); this is just an additional, ownership-scoped path.
  if (revenueRate !== undefined) {
    const rate = Number(revenueRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      throw new ApiError(
        400,
        'Revenue rate must be a number between 0 and 100',
      );
    }
    findUser.revenueRate = String(rate);
  }

  await findUser.save();

  return { success: true, message: 'Permissions updated successfully' };
};
const exportUsers = async () => {
  return await User.find({});
};
export const UserService = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  registrationUser,
  activateUser,
  loginUser,
  resolveUserForRefresh,
  changePassword,
  updateProfile,
  profileVerification,
  labelVerification,
  signatureVerification,
  updateProfilePicture,
  createSubUser,
  mySubUser,
  addClientImage,
  givePermission,
  getUserById,
  exportUsers,
};
