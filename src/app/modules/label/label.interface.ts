import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export type ILabel = {
  user: Types.ObjectId | IUser;
  labelName: string;
  youtubeChannel: string;
  youtubeUrl: string;
  labelId: number;
  avatar?: string;
  banner?: string;
  approvedStatus: 'pending' | 'approved' | 'rejected';
};
