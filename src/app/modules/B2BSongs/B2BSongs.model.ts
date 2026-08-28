import { Schema, model } from 'mongoose';

import { IB2BSongs } from './B2BSongs.interface';

const videosSchema = new Schema<IB2BSongs>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
    durationMs: {
      type: Number,
    },
    videoId: {
      type: String,
      required: true,
    },
    sourceCompany: {
      type: String,
      required: true,
    },

    version: {
      type: String,
      required: true,
    },
    explicit: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    title: {
      type: String,
      required: true,
    },
    primaryArtist: {
      type: [String],
    },

    featuringArtists: {
      type: [String],
    },
    writer: {
      type: String,
    },
    composer: {
      type: String,
    },
    musicDirector: {
      type: String,
    },
    producer: {
      type: String,
    },
    editor: {
      type: String,
    },
    label: {
      type: String,
      // ref: 'Label',
    },
    genre: {
      type: String,
      required: true,
    },
    subGenre: {
      type: String,
    },
    language: {
      type: String,
    },
    upc: {
      type: String,
    },
    isrc: {
      type: String,
    },
    audioIsrc: {
      type: String,
    },
    storeReleaseDate: {
      type: String,
    },
    releaseDate: {
      type: String,
    },

    vevoChannel: {
      type: String,
    },
    repertoireOwner: {
      type: String,
      required: true,
    },
    youtubeLink: {
      type: String,
    },
    time: {
      type: String,
    },
    visibility: {
      type: String,
    },
    keywords: {
      type: [],
    },
    videoLink: {
      type: String,
    },
    assetId: {
      type: String,
    },
    copyright: {
      type: String,
    },
    copyrightYear: {
      type: String,
    },
    territoryPolicy: {
      type: String,
    },
    isKids: {
      type: String,
      enum: ['Yes', 'No'],
    },
    isExist: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    alreadyHaveAnVevoChannel: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    videoAlreadyExistOnYoutube: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    youtubePremiere: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },

    countdownTheme: {
      type: String,
    },
    countdownLength: {
      type: String,
    },
    description: {
      type: String,
    },
    corrections: {
      type: [String],
      default: [],
    },
    isCorrection: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
    },
    videoStatus: {
      type: String,
      enum: ['take-down', 'distribute', 'none'],
      default: 'none',
    },
  },
  {
    timestamps: true,
  },
);

export const B2BSongs = model<IB2BSongs>('B2BSongs', videosSchema);
