import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export type IChannel = {
  user: Types.ObjectId | IUser;
  channelName: string;
  channelId: number;
  channelSpotifyId: string;
  channelAppleId: string;
  channelFacebookId: string;
  channelInstagramId: string;
  youtubeLink: string;
  avatar: string;
  banner: string;
  keywords: string[];
  description: string;
  isKids: boolean;

  isApproved: 'pending' | 'approved' | 'rejected';
  isEditApproved: 'pending' | 'approved' | 'rejected';
};

export type UploadedFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  bucket: string;
  key: string;
  acl: string;
  contentType: string;
  contentDisposition: string | null;
  contentEncoding: string | null;
  storageClass: string;
  serverSideEncryption: string | null;
  metadata?: Record<string, any>;
  location: string;
  etag: string;
  versionId?: string;
};

export type CustomRequest = {
  files?: {
    avatar?: UploadedFile[];
    banner?: UploadedFile[];
  };
  body: {
    id: string;
    channelAppleId?: string;
    channelFacebookId?: string;
    channelInstagramId?: string;
    channelSpotifyId?: string;
    channelName?: string;
    description?: string;
    isApproved?: string;
    isEditApproved?: string;
    isKids?: string;
    keywords?: string;
    youtubeLink?: string;
    vevoChannel?: string;
  };
} & Request;
