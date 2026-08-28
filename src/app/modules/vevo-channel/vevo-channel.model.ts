import { Schema, model } from 'mongoose';
import { IChannel } from './vevo-channel.interface';
import { attachStatusChangeHook } from '../notifications/notification.hooks';

const channelSchema = new Schema<IChannel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channelName: {
      type: String,
      required: true,
      trim: true,
    },
    channelId: {
      type: Number,
      required: true,
    },
    channelSpotifyId: {
      type: String,
      trim: true,
    },
    channelAppleId: {
      type: String,
      trim: true,
    },
    channelFacebookId: {
      type: String,
      trim: true,
    },
    channelInstagramId: {
      type: String,
      trim: true,
    },
    youtubeLink: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    banner: {
      type: String,
    },
    keywords: {
      type: [String],
    },
    description: {
      type: String,
    },
    isKids: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isEditApproved: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
    },
  },
  {
    timestamps: true,
  },
);

attachStatusChangeHook(channelSchema, 'vevo-channel', {
  statusField: 'isApproved',
  titleField: 'channelName',
});

export const Channel = model('Channel', channelSchema);
