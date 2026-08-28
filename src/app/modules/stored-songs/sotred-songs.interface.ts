import mongoose from 'mongoose';
import { IStore } from '../store/sotre.interface';
import { ISingleTrack } from '../single-track/single.interface';
import IAlbumMusic from '../album/album.interface';

export type IStoredSongs = {
  storeId: mongoose.Types.ObjectId | IStore;
  contentId: mongoose.Types.ObjectId | ISingleTrack | IAlbumMusic;
  storeStatus: 'delivered' | 'akeDown' | 'pending';
  contentType: 'SingleTrack' | 'Album' | 'Video';
};
