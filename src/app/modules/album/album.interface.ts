import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';
import { ILabel } from '../label/label.interface';
import { IPrimaryArtist } from '../primary-artist/primary-artist.interface';

type IAudio = {
  path: string;
  releaseTitle: string;
  subtitle: string;
  primaryArtist: [Types.ObjectId | IPrimaryArtist];
  label: Types.ObjectId | ILabel;
  writer: string[];
  composer: string[];
  musicDirectors: string[];
  producers: string[];
  featuring: string[];
  genre: string;
  upcEan: string;
  subGenre: string;
  format: string;
  originalReleaseDate: string;
  lyricsLanguage: string;
  productionYear: string;
  youtube: string;
  lyrics: string;
  isrc: string;
};

type IAlbumMusic = {
  audio: IAudio[];
  image: string;
  releaseTitle: string;
  subtitle: string;
  pLine: string;
  cLine: string;
  primaryArtist: Types.ObjectId | IPrimaryArtist;
  label: Types.ObjectId | ILabel;
  originalReleaseDate: string;
  physicalReleaseDate: string;
  storeReleaseDate: string;
  producerCatalogNumber: string;
  productionYear: string;
  catalogNumber: string;
  isApproved: 'approved' | 'rejected' | 'pending';
  songStatus: 'take-down' | 'distribute' | 'none';
  releaseId: string;
  user: Types.ObjectId | IUser;
  songType: 'album';
  countries: [];
  corrections: [];
  isCorrection: boolean;
};

export default IAlbumMusic;
