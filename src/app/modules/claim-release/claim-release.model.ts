import { Schema, model } from 'mongoose';
import {
  IArtistChannelRequest,
  IFacebookClaimRequest,
  IFacebookWhitelistRequest,
  ITikTokClaimRequest,
  IWhitelistRequest,
  IYoutubeClaimRequest,
  IYoutubeManualClaim,
  IYoutubeTakeDown,
} from './claim-release.interface';

const TikTokClaimRequestSchema = new Schema<ITikTokClaimRequest>(
  {
    email: { type: String, required: true },
    songTitle: { type: String, required: true },
    ugclink: { type: String, required: true },
    pgcLink: { type: String, required: true },
    timeForPgc: { type: String, required: true },
    timeForUgc: { type: String, required: true },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const FacebookClaimRequestSchema = new Schema(
  {
    email: { type: String, required: true },
    songTitle: { type: String, required: true },

    url: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const FacebookWhitelistRequestSchema = new Schema<IFacebookWhitelistRequest>(
  {
    email: { type: String, required: true },
    labelName: { type: String, required: true },
    url: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const YoutubeClaimRequestSchema = new Schema<IYoutubeClaimRequest>(
  {
    email: { type: String, required: true },

    songTitle: { type: String, required: true },

    url: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const YoutubeTakeDownSchema = new Schema<IYoutubeTakeDown>(
  {
    email: { type: String, required: true },

    songTitle: { type: String, required: true },

    url: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const YoutubeManualClaimSchema = new Schema<IYoutubeManualClaim>(
  {
    email: { type: String, required: true },

    songTitle: { type: String, required: true },

    url: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const ArtistChannelRequestSchema = new Schema<IArtistChannelRequest>(
  {
    channel_link: { type: String, required: true },
    upc_1: { type: String, required: true },
    topic_link: { type: String, required: true },
    upc_2: { type: String, required: true },
    upc_3: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const WhitelistRequestSchema = new Schema<IWhitelistRequest>(
  {
    url: {
      type: String,
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

export const ArtistChannelRequest = model<IArtistChannelRequest>(
  'ArtistChannelRequest',
  ArtistChannelRequestSchema,
);
export const YoutubeManualClaim = model<IYoutubeManualClaim>(
  'YoutubeManualClaim',
  YoutubeManualClaimSchema,
);
export const YoutubeTakeDown = model<IYoutubeTakeDown>(
  'YoutubeTakeDown',
  YoutubeTakeDownSchema,
);
export const YoutubeClaimRequest = model<IYoutubeClaimRequest>(
  'YoutubeClaimRequest',
  YoutubeClaimRequestSchema,
);
export const FacebookWhitelistRequest = model<IFacebookWhitelistRequest>(
  'FacebookWhitelistRequest',
  FacebookWhitelistRequestSchema,
);
export const FacebookClaimRequest = model<IFacebookClaimRequest>(
  'FacebookClaimRequest',
  FacebookClaimRequestSchema,
);
export const TikTokClaimRequest = model<ITikTokClaimRequest>(
  'TikTokClaimRequest',
  TikTokClaimRequestSchema,
);
export const WhitelistRequest = model<IWhitelistRequest>(
  'WhitelistRequest',
  WhitelistRequestSchema,
);
