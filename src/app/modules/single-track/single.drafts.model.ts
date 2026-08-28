import { Schema, model } from 'mongoose';
import { ISingleTrack } from './single.interface';

const singleMusicSchema = new Schema<ISingleTrack>(
  {
    audio: {
      type: String,
    },
    image: {
      type: String,
    },
    primaryTrackType: {
      type: String,
      enum: ['Music', 'Classic Music', 'Jazz Music'],
    },
    isRelease: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    instrumental: {
      type: String,
      enum: ['Yes', 'No'],
    },
    secondaryTrackType: {
      type: String,
      enum: ['Original', 'Karaoke', 'Medley', 'Cover', 'Cover by cover band'],
    },
    parentalAdvisory: {
      type: String,
      enum: ['Yes', 'No', 'Cleaned'],
    },
    releaseTitle: {
      type: String,
    },
    previewStart: {
      type: String,
      //
    },
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    pLine: {
      type: String,
    },
    cLine: {
      type: String,
    },
    remixer: {
      type: String,
    },
    author: {
      type: String,
    },
    primaryArtist: {
      type: [String],
    },
    writer: {
      type: [],
    },
    composer: {
      type: String,
    },
    arranger: {
      type: String,
      //
    },
    producer: {
      type: String,
      //
    },
    musicDirector: {
      type: [String],
      //
    },
    featuringArtists: {
      type: [String],
      //
    },
    actor: {
      type: String,
      //
    },
    filmDirector: {
      type: String,
      //
    },
    genre: {
      type: String,
    },
    subGenre: {
      type: String,
    },
    upc: {
      type: String,
    },
    producerCatalogNumber: {
      type: String,
      //
    },
    productionYear: {
      type: String,
    },
    label: {
      type: String,
    },
    publisher: {
      type: String,
    },
    isrc: {
      type: String,
    },
    catalogNumber: {
      type: String,
      //
    },
    trackTitleLanguage: {
      type: String,
    },
    lyricsLanguage: {
      type: String,
    },
    releaseDate: {
      type: String,
    },
    advancePurchaseDate: {
      type: String,
    },
    lyrics: {
      type: String,
    },
    crbtTitle: {
      type: String,
    },
    crbtTime: {
      type: String,
    },
    status: {
      type: Boolean,
      default: false,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isApproved: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
    },
    songStatus: {
      type: String,
      enum: ['take-down', 'distribute', 'none'],
      default: 'none',
    },
    releaseId: {
      type: String,
    },
    songType: {
      type: String,
      enum: ['single'],
      default: 'single',
    },
    format: {
      type: String,
      enum: ['Single', 'Album', 'EP'],
    },
    contentType: {
      type: String,
      enum: ['Audio', 'Video'],
    },

    price: {
      type: String,
    },
    countries: {
      type: [],
    },

    corrections: {
      type: [String],
      default: [],
    },
    isCorrection: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const SingleDraft = model<ISingleTrack>(
  'SingleDraft',
  singleMusicSchema,
);
