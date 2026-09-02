import { Schema, model } from 'mongoose';
import { ISingleTrack } from './single.interface';
import { attachStatusChangeHook } from '../notifications/notification.hooks';

const singleMusicSchema = new Schema<ISingleTrack>(
  {
    audio: {
      type: String,
      required: true,
    },
    trimmedAudio: { type: String },
    crbtTitle: { type: String },
    image: {
      type: String,
      required: true,
    },
    primaryTrackType: {
      type: String,
      enum: ['Music', 'Classic Music', 'Jazz Music'],
      required: true,
    },
    isRelease: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    instrumental: {
      type: String,
      enum: ['Yes', 'No'],
      required: true,
    },
    secondaryTrackType: {
      type: String,
      enum: ['Original', 'Karaoke', 'Medley', 'Cover', 'Cover by cover band'],
      required: true,
    },
    parentalAdvisory: {
      type: String,
      enum: ['Explicit', 'Not Explicit'],
      default: 'Not Explicit',
    },
    releaseTitle: {
      type: String,
      required: true,
    },
    previewStart: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      sparse: true,
      unique: true,
    },
    subtitle: {
      type: String,
    },
    pLine: {
      type: String,
      required: true,
    },
    cLine: {
      type: String,
      required: true,
    },
    remixer: {
      type: String,
    },
    // No longer required — the new upload form drives credits via
    // `contributors[]` and auto-fills this (and the other legacy flat
    // fields below) for backward compatibility. See contributor.utils.ts.
    author: {
      type: String,
    },
    // Store artist NAMES (strings), same as the video flow — not ObjectId refs.
    primaryArtist: {
      type: [String],
      required: true,
    },

    composer: {
      type: String,
    },
    arranger: {
      type: String,
    },
    producer: {
      type: String,
    },
    musicDirector: {
      type: [String],
    },
    featuringArtists: {
      type: [String],
    },
    actor: {
      type: String,
    },
    filmDirector: {
      type: String,
    },
    genre: {
      type: String,
      required: true,
    },
    subGenre: {
      type: String,
    },
    upc: {
      type: String,
    },
    producerCatalogNumber: {
      type: String,
    },
    productionYear: {
      type: String,
      required: true,
    },
    // Store label NAME (string), same as the video flow — not an ObjectId ref.
    // Not schema-required any more — only meaningful when hasRecordLabel is
    // true (enforced client-side / at the service layer, not the DB).
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
    },
    trackTitleLanguage: {
      type: String,
      required: true,
    },
    lyricsLanguage: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: String,
      required: true,
    },
    advancePurchaseDate: {
      type: String,
    },
    lyrics: {
      type: String,
    },
    platform: {
      type: String,
      default: 'AllPlatformWithYouTube',
    },
    mood: {
      type: String,
    },
    status: {
      type: Boolean,
      default: false,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isApproved: {
      type: String,
      enum: ['approved', 'rejected', 'pending', 'in_review'],
      default: 'pending',
    },
    songStatus: {
      type: String,
      enum: ['take-down', 'distribute', 'none'],
      default: 'none',
    },
    releaseId: {
      type: String,
      required: true,
    },
    songType: {
      type: String,
      enum: ['single'],
      default: 'single',
    },
    format: {
      type: String,
      enum: ['Single', 'Album', 'EP'],
      default: 'Album',
    },
    contentType: {
      type: String,
      enum: ['Album', 'Single', 'Compilation', 'Remix'],
      required: true,
    },

    price: {
      type: String,
      required: true,
    },
    crbtTime: {
      type: String,
      // required: true,
    },

    isCorrection: {
      type: Boolean,
      default: false,
    },
    // Master-review gate for sub-user uploads (Phase 2 of the sub-user
    // permission system). Defaults to 'approved' so a master's own direct
    // uploads skip this step entirely and behave exactly as before; it is
    // only ever set to 'pending' at creation time when the uploader is a
    // sub-user (see single.service.ts uploadSingle).
    isSubUserUpload: {
      type: Boolean,
      default: false,
    },
    masterApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    revelatorStatus: {
      type: String,
      enum: ['none', 'queued', 'processing', 'live', 'failed'],
      default: 'none',
    },
    revelatorError: {
      type: String,
    },
    revelatorJobId: {
      type: String,
    },
    sentToRevelatorAt: {
      type: Date,
    },
    revelatorAssetTitle: {
      type: String,
    },

    contributors: {
      type: [
        {
          name: { type: String, required: true },
          roleId: { type: Number, required: true },
          roleName: { type: String, required: true },
          roleGroupId: { type: Number, required: true },
          sharePercent: { type: Number },
        },
      ],
      default: [],
    },
    hasIsrc: {
      type: Boolean,
      default: false,
    },
    isCompilation: {
      type: Boolean,
      default: false,
    },
    hasRecordLabel: {
      type: Boolean,
      default: false,
    },
    previouslyReleased: {
      type: Boolean,
      default: false,
    },
    previousReleaseDate: {
      type: String,
    },
    iswc: {
      type: String,
    },
    trackProperties: {
      type: [String],
      default: [],
    },
    origin: {
      type: String,
      enum: ['original', 'public-domain', 'cover'],
      default: 'original',
    },
    copyrightPYear: { type: String },
    copyrightPText: { type: String },
    copyrightCYear: { type: String },
    copyrightCText: { type: String },
    localizations: {
      type: [
        {
          language: { type: String, required: true },
          title: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

attachStatusChangeHook(singleMusicSchema, 'single-track', {
  statusField: 'isApproved',
  titleField: 'title',
});

export const SingleTrack = model<ISingleTrack>(
  'SingleTrack',
  singleMusicSchema,
);
