import { Types } from 'mongoose';
import IGenericErrorMessage from './error';
import { IUser } from '../app/modules/user/user.interface';
import { JwtPayload } from 'jsonwebtoken';

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
};
export type IReqUser = {
  userId: Types.ObjectId | IUser;
  role: 'user' | 'admin' | 'sub-user';
};
type UploadedFile = {
  location: any;
  mv: any;
  originalname: string;
  filename: string;
  path: string;
};
export type CustomRequest = {
  files?: {
    thumbnail?: UploadedFile[];
    video_thumbnail?: UploadedFile[];
    video?: UploadedFile[];
    image?: UploadedFile[];
    statics: UploadedFile[];
    audio: UploadedFile[];
  };
  params: {
    id: string;
  };
  body: any;
  user: JwtPayload;
  company: string;
} & Request;
