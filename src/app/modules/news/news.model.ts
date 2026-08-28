import { Schema, model } from 'mongoose';
import { INews } from './news.interface';
const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: true,
      sparse: true,
      unique: true,
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

export const News = model('News', newsSchema);
