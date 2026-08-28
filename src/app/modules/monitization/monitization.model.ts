import { Schema, model } from 'mongoose';
import { IMonetization } from './monitization.interface';

const MonetizationSchemaSchema = new Schema<IMonetization>(
  {
    channelName: {
      type: String,
    },
    channelLogo: {
      type: String,
    },
    user: {
      type: String,
      ref: 'User',
      required: true,
    },
    viewCount: {
      type: String,
    },
    subscriberCount: {
      type: String,
    },
    videoCount: {
      type: String,
    },
    monetized: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  },
);

export const Monetization = model('Monetization', MonetizationSchemaSchema);
