import { Schema, model } from 'mongoose';
import { IBanner } from './banner.interface';

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const Banner = model('Banner', BannerSchema);
