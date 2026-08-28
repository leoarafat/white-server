import { Schema, model } from 'mongoose';
import { ISmartLink, ISmartLinkClick } from './smart-link.interface';

const dspLinkSchema = new Schema(
  {
    platform: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const smartLinkSchema = new Schema<ISmartLink>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    single: {
      type: Schema.Types.ObjectId,
      ref: 'SingleTrack',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    artworkUrl: {
      type: String,
    },
    dspLinks: {
      type: [dspLinkSchema],
      default: [],
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    createdBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  },
);

export const SmartLink = model<ISmartLink>('SmartLink', smartLinkSchema);

const smartLinkClickSchema = new Schema<ISmartLinkClick>(
  {
    smartLink: {
      type: Schema.Types.ObjectId,
      ref: 'SmartLink',
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      enum: ['mobile', 'desktop'],
      default: 'desktop',
    },
    referrer: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
smartLinkClickSchema.index({ smartLink: 1, createdAt: -1 });

export const SmartLinkClick = model<ISmartLinkClick>(
  'SmartLinkClick',
  smartLinkClickSchema,
);
