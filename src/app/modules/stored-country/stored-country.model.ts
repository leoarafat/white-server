import { Schema, model } from 'mongoose';
import { IStoredCountry } from './stored-country.interface';

const countrySchema = new Schema<IStoredCountry>(
  {
    countryName: {
      type: String,
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
  },
  {
    timestamps: true,
  },
);

export const StoredCountry = model('StoredCountry', countrySchema);
