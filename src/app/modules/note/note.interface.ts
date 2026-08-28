import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export type INote = {
  user: Types.ObjectId | IUser;
  title: string;
  description: string;
};
