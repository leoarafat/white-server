import { Schema, model } from 'mongoose';
import { IStoredSongs } from './sotred-songs.interface';

const storeSchema = new Schema<IStoredSongs>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    contentType: {
      type: String,
      enum: ['SingleTrack', 'Album', 'Video'],
      required: true,
    },
    storeStatus: {
      type: String,
      enum: ['Delivered', 'Takedown', 'Pending'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const StoredSongs = model('StoredSongs', storeSchema);
