import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export type IDspLink = {
  platform: string;
  url: string;
};

export type ISmartLink = {
  slug: string;
  user: Types.ObjectId | IUser;
  single: Types.ObjectId;
  title: string;
  artworkUrl: string;
  dspLinks: IDspLink[];
  totalClicks: number;
  status: 'active' | 'disabled';
  createdBy: 'user' | 'admin';
};

export type ISmartLinkClick = {
  smartLink: Types.ObjectId;
  platform: string;
  device: 'mobile' | 'desktop';
  referrer?: string;
};
