import mongoose from 'mongoose';

import { IUser } from '../user/user.interface';

export type IVideos = {
  image: string;
  video: string;
  videoId: string;
  durationMs: number;
  ddexS3Folder?: string;
  ddexStatus?: string;
  version:
    | 'Lyrical Video'
    | 'Interview'
    | 'Alternative Version'
    | 'Official'
    | 'Live'
    | 'Behind The Scenes'
    | 'Teaser'
    | 'Original Content'
    | 'Pseudo Video';
  explicit: 'Yes' | 'No';
  title: string;
  primaryArtist: string[];
  // primaryArtist: [mongoose.Types.ObjectId | IPrimaryArtist];
  featuringArtists: string[];
  writer: string;
  composer: string;
  musicDirector: string;
  producer: string;
  editor: string;
  label: string;
  // label: mongoose.Types.ObjectId | ILabel;
  user: mongoose.Types.ObjectId | IUser;
  genre: string;
  subGenre: string;
  language: string;
  upc: string;
  isrc: string;
  audioIsrc: string;
  videoMd5: string;
  imageMd5: string;
  videoSizeBytes: number;
  imageSizeBytes: number;
  storeReleaseDate: string;
  releaseDate: string;
  alreadyHaveAnVevoChannel: 'Yes' | 'No';
  videoAlreadyExistOnYoutube: 'Yes' | 'No';
  vevoChannel: string;
  videoLink: string;
  youtubeLink: string;
  assetId: string;
  keywords: [];
  copyright: string;
  copyrightYear: string;
  isKids: 'Yes' | 'No';
  isExist: 'Yes' | 'No';
  territoryPolicy: string;
  youtubePremiere: 'Yes' | 'No';
  description: string;
  corrections: [];
  isCorrection: boolean;
  isSubUserUpload: boolean;
  masterApprovalStatus: 'pending' | 'approved' | 'rejected';
  repertoireOwner: string;
  visibility: string;
  time: string;
  countdownTheme: string;
  countdownLength: string;
  isVevo: boolean;
  vevoTransferStatus: 'none' | 'processing' | 'completed' | 'failed';
  vevoTransferError?: string | null;
  vevoTransferStartedAt?: Date | null;
  vevoTransferredAt?: Date | null;
  isApproved: 'approved' | 'rejected' | 'pending' | 'in_review';
  videoStatus: 'take-down' | 'distribute' | 'none';
  updatedTime?: Date;
};
