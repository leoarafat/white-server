import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';

import { ILabel } from '../label/label.interface';
import { IPrimaryArtist } from '../primary-artist/primary-artist.interface';

// Role-based contributor — Revelator-shaped (see revelatorfinal.md §7.5):
// roleGroupId 1=Key Artist, 2=Performer, 3=Producer & Engineer, 4=Writer/Publisher.
export type IContributor = {
  name: string;
  roleId: number;
  roleName: string;
  roleGroupId: 1 | 2 | 3 | 4;
  sharePercent?: number;
};

export type ILocalization = {
  language: string;
  title: string;
};

export type ISingleTrack = {
  audio: string;
  trimmedAudio?: string;
  image: string;
  primaryTrackType: 'music' | 'classic-music' | 'jazz-music';
  isRelease: 'Yes' | 'No';
  instrumental: 'yes' | 'no';
  secondaryTrackType:
    | 'original'
    | 'karaoke'
    | 'melody'
    | 'cover'
    | 'cover-by-band';
  parentalAdvisory: string;
  releaseTitle: string;
  previewStart: string;
  title: string;
  subtitle: string;
  pLine: string;
  cLine: string;
  remixer: string;
  author: string;
  primaryArtist: string[];
  writer: string[];
  composer: string;
  arranger: string;
  producer: string;
  musicDirector: string[];
  featuringArtists: string[];
  featuring: string[];
  actor: string;
  filmDirector: string;
  genre: string;
  subGenre: string;
  upc: string;
  producerCatalogNumber: string;
  productionYear: string;
  label: string;
  publisher: string;
  isrc: string;
  catalogNumber: string;
  trackLanguage: string;
  trackTitleLanguage: string;
  lyricsLanguage: string;
  releaseDate: string;
  advancePurchaseDate: string;
  lyrics: string;
  status: boolean;
  isApproved: 'approved' | 'rejected' | 'pending' | 'in_review';
  songStatus: 'take-down' | 'distribute' | 'none';
  user: Types.ObjectId | IUser;
  releaseId: string;
  songType: 'single';
  format: 'Single' | 'Album' | 'EP';
  contentType: string;
  askToGenerateISRC: 'yes' | 'no';
  price: string;
  countries: [];
  corrections: [];
  isCorrection: boolean;
  isSubUserUpload: boolean;
  masterApprovalStatus: 'pending' | 'approved' | 'rejected';
  platform: string;
  mood: string;
  crbtTitle: string;
  crbtTime: string;
  revelatorStatus: 'none' | 'queued' | 'processing' | 'live' | 'failed';
  revelatorError?: string;
  revelatorJobId?: string;
  sentToRevelatorAt?: Date;
  revelatorAssetTitle?: string;

  // Revelator-shaped fields (see revelatorfinal.md field map)
  contributors: IContributor[];
  hasIsrc: boolean;
  isCompilation: boolean;
  hasRecordLabel: boolean;
  previouslyReleased: boolean;
  previousReleaseDate?: string;
  iswc?: string;
  trackProperties: string[];
  origin: 'original' | 'public-domain' | 'cover';
  copyrightPYear?: string;
  copyrightPText?: string;
  copyrightCYear?: string;
  copyrightCText?: string;
  localizations?: ILocalization[];
};
