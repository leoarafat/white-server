/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';
export type IAdmin = {
  _id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'admin' | 'super-admin';
  image: string;
  twoFactor?: {
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
  };
};
export type AdminModel = {
  isAdminExist(
    email: string,
  ): Promise<Pick<IAdmin, '_id' | 'email' | 'password' | 'role'>>;
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string,
  ): Promise<boolean>;
} & Model<IAdmin>;
