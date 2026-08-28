import mongoose from 'mongoose';
import { ISingleTrack } from '../single-track/single.interface';
import IAlbumMusic from '../album/album.interface';

export type IStoredCountry = {
  countryName: string;
  contentId: mongoose.Types.ObjectId | ISingleTrack | IAlbumMusic;
  storeStatus: 'delivered' | 'takeDown' | 'pending';
  contentType: 'SingleTrack' | 'Album' | 'Video';
};
