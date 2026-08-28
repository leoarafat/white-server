/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';
export type IEmailOptions = {
  email: string;
  subject: string;
  // template: string;
  // data?: { [key: string]: any };
  html: any;
  attachments?: any;
};
export type IRegistration = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'super-admin';
  avatar?: string;
  phoneNumber: string;
};
export type IActivationToken = {
  token: string;
  activationCode: string;
};
export type IActivationRequest = {
  activation_token: string;
  activation_code: string;
};

export type IUser = {
  user: any;
  _id?: string;
  name: string;
  email: string;
  clientId: string;
  phoneNumber: string;
  nidNumber: string;
  revenueRate: string;
  masterShareRate: string;
  password: string;
  address: string;
  role: 'admin' | 'super-admin' | 'user' | 'sub-user';
  image: string;
  nidFront: string;
  nidBack: string;
  signature: string;
  country: string;
  state: string;
  city: string;
  postCode: string;
  channelName: string;
  channelUrl: string;
  subscribeCount: number;
  videosCount: number;
  copyrightNoticeImage: string;
  dashboardScreenShot: string;
  balance: number;
  isVerified: false;
  isBlock: boolean;
  permission: string[];
  assignedLabels: (Types.ObjectId | string)[];
  assignedArtists: (Types.ObjectId | string)[];
  assignedChannels: (Types.ObjectId | string)[];
  note: [];
  currentDistributor: string;
  howHereUs: string;
  accountStatus: 'lock' | 'terminate' | 'un-lock';
  isApproved: 'pending' | 'approved' | 'rejected';
  twoFactor?: {
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
  };
};
export type UserModel = {
  isUserExist(
    email: string,
  ): Promise<Pick<IUser, '_id' | 'email' | 'password' | 'role'>>;
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string,
  ): Promise<boolean>;
} & Model<IUser>;
