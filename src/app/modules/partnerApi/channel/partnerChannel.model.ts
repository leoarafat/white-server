import mongoose, { Schema } from 'mongoose';
import { PartnerEnvironment } from '../partnerApi.constants';

export const PARTNER_CHANNEL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type PartnerChannelStatus = (typeof PARTNER_CHANNEL_STATUSES)[number];

export interface IPartnerChannel {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  partnerKey: mongoose.Types.ObjectId;
  environment: PartnerEnvironment;
  channelName: string;
  artistName: string | null;
  status: PartnerChannelStatus;
  channelUrl: string | null;
  youtubeChannelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerChannelSchema = new Schema<IPartnerChannel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    partnerKey: { type: Schema.Types.ObjectId, ref: 'PartnerKey', required: true },
    environment: { type: String, enum: ['live', 'test'], required: true, index: true },
    channelName: { type: String, required: true, trim: true },
    artistName: { type: String, default: null },
    status: { type: String, enum: PARTNER_CHANNEL_STATUSES, default: 'pending', index: true },
    channelUrl: { type: String, default: null },
    youtubeChannelId: { type: String, default: null },
  },
  { timestamps: true },
);

PartnerChannelSchema.index({ user: 1, environment: 1, channelName: 1 });

export const PartnerChannel = mongoose.model<IPartnerChannel>(
  'PartnerChannel',
  PartnerChannelSchema,
);
