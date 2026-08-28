import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export type ITikTokClaimRequest = {
  email: string;
  songTitle: string;
  ugclink: string;
  pgcLink: string;
  timeForPgc: string;
  timeForUgc: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
export type IFacebookClaimRequest = {
  email: string;
  labelName: string;
  upc: string;
  url: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
export type IFacebookWhitelistRequest = {
  email: string;
  labelName: string;
  url: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
export type IYoutubeClaimRequest = {
  email: string;
  labelName: string;
  songTitle: string;
  upc: string;
  url: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
export type IYoutubeTakeDown = {
  email: string;
  labelName: string;
  songTitle: string;
  upc: string;
  url: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
export type IYoutubeManualClaim = {
  email: string;
  labelName: string;
  songTitle: string;
  upc: string;
  url: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
export type IArtistChannelRequest = {
  channel_link: string;
  upc_1: string;
  topic_link: string;
  upc_2: string;
  upc_3: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
export type IWhitelistRequest = {
  url: string;
  user: Types.ObjectId | IUser;
  approvedStatus: 'pending' | 'accepted' | 'rejected';
};
