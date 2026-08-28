import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export type IBankAccount = {
  accountName: string;
  branchName: string;
  bankName: string;
  accountNumber: string;
  phoneNumber: string;
  user: Types.ObjectId | IUser;
  userId: string;
};
export type IMobileBankAccount = {
  accountName: string;
  providerName: string;
  accountNumber: string;
  user: Types.ObjectId | IUser;
  userId: string;
};
export type IPioneerAccount = {
  accountName: string;
  email: string;
  accountNumber: string;
  user: Types.ObjectId | IUser;
  userId: string;
};
