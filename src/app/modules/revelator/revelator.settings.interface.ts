import { Types } from 'mongoose';

export type IRevelatorSettings = {
  username: string;
  passwordEncrypted: string;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
};
