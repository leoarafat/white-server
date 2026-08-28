import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';
export type IMonetization = {
  user: Types.ObjectId | IUser;
  subscriberCount: string;
  viewCount: string;
  channelLogo: string;
  channelName: string;
  videoCount: string;
  monetized: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
};
