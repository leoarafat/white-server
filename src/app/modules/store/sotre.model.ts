import { Schema, model } from 'mongoose';
import { IStore } from './sotre.interface';

const storeSchema = new Schema<IStore>(
  {
    storeId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    storeStatus: {
      type: String,
      enum: ['Delivered', 'Pending', 'Takedown'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  },
);

export const Store = model('Store', storeSchema);
