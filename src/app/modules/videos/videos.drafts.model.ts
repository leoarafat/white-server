import { Schema, model } from 'mongoose';
import { IVideos } from './videos.interface';

// Mirrors the Video schema but with nothing required and no unique indexes —
// a draft is an intentionally incomplete, private working copy that must
// never trip a validation or uniqueness error while the user is still
// filling it in. See single-track/single.drafts.model.ts for the same
// pattern on the audio side.
const videoDraftSchema = new Schema<IVideos>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    image: { type: String },
    video: { type: String },
    videoId: { type: String },
    durationMs: { type: Number },
    version: { type: String },
    explicit: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    title: { type: String },
    primaryArtist: { type: [String] },
    featuringArtists: { type: [String] },
    writer: { type: String },
    composer: { type: String },
    musicDirector: { type: String },
    producer: { type: String },
    editor: { type: String },
    label: { type: String },
    genre: { type: String },
    subGenre: { type: String },
    language: { type: String },
    upc: { type: String },
    isrc: { type: String },
    audioIsrc: { type: String },
    storeReleaseDate: { type: String },
    releaseDate: { type: String },
    vevoChannel: { type: String },
    repertoireOwner: { type: String },
    youtubeLink: { type: String },
    time: { type: String },
    visibility: { type: String },
    keywords: { type: [] },
    videoLink: { type: String },
    assetId: { type: String },
    copyright: { type: String },
    copyrightYear: { type: String },
    territoryPolicy: { type: String },
    isKids: {
      type: String,
      enum: ['Yes', 'No'],
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
    countdownTheme: { type: String },
    countdownLength: { type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  },
);

export const VideoDraft = model<IVideos>('VideoDraft', videoDraftSchema);
