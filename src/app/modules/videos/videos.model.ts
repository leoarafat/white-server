import { Schema, model } from 'mongoose';
import { IVideos } from './videos.interface';
import { attachStatusChangeHook } from '../notifications/notification.hooks';

const videosSchema = new Schema<IVideos>(
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
    videoMd5: { type: String },
    imageMd5: { type: String },
    videoSizeBytes: { type: Number },
    imageSizeBytes: { type: Number },
    durationMs: { type: Number },
    videoId: {
      type: String,
      required: true,
      // Server-generated only (see utils/videoId.ts). The unique index is the
      // hard guarantee — the generator just avoids tripping it.
      unique: true,
    },

    version: {
      type: String,
      // required: true,
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
      // Uniqueness is enforced by a PARTIAL index below, not here. A plain
      // `unique: true` indexes missing/empty ISRCs as null and rejects the
      // second video that has no ISRC yet (ISRC is assigned later by admin).
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
    isVevo: {
      type: Boolean,
      default: false,
    },
    vevoTransferStatus: {
      type: String,
      enum: ['none', 'processing', 'completed', 'failed'],
      default: 'none',
    },
    vevoTransferError: {
      type: String,
      default: null,
    },
    vevoTransferStartedAt: {
      type: Date,
      default: null,
    },
    vevoTransferredAt: {
      type: Date,
      default: null,
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
    updatedTime: {
      type: Date,
    },
    // Master-review gate for sub-user uploads — see the matching comment in
    // single-track/single.model.ts for the full explanation.
    isSubUserUpload: {
      type: Boolean,
      default: false,
    },
    masterApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
  },
  {
    timestamps: true,
  },
);

// ISRC must be unique only across videos that actually have one. The partial
// filter (`$gt: ''` matches non-empty strings, excluding null/absent/empty)
// lets any number of videos exist without an ISRC while still blocking real
// duplicates once ISRCs are assigned.
videosSchema.index(
  { isrc: 1 },
  { unique: true, partialFilterExpression: { isrc: { $gt: '' } } },
);

attachStatusChangeHook(videosSchema, 'video', {
  statusField: 'isApproved',
  titleField: 'title',
  secondaryStatusField: 'videoStatus',
  secondaryTakeDownValue: 'take-down',
});

export const Video = model<IVideos>('Video', videosSchema);
