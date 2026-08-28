import { Schema, model } from 'mongoose';
import { IPrimaryArtist } from './primary-artist.interface';

const primaryArtistSchema = new Schema<IPrimaryArtist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    primaryArtistName: {
      type: String,
      required: true,
    },
    primaryArtistId: {
      type: Number,
      required: true,
      sparse: true,
      unique: true,
    },
    primaryArtistAppleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    primaryArtistFacebookId: {
      type: String,
      sparse: true,
      unique: true,
    },
    primaryArtistSpotifyId: {
      type: String,
      sparse: true,
      unique: true,
    },
    primaryArtistInstagramId: {
      type: String,
      sparse: true,
      unique: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const PrimaryArtist = model('PrimaryArtist', primaryArtistSchema);
