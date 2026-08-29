import mongoose, { Schema } from 'mongoose';
import { PartnerEnvironment } from '../partnerApi.constants';

export const PARTNER_RELEASE_STATUSES = [
  'pending',
  'needs_fix',
  'approved',
  'delivered',
  'rejected',
  'taken_down',
] as const;

export type PartnerReleaseStatus = (typeof PARTNER_RELEASE_STATUSES)[number];

export interface IPartnerRelease {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  partnerKey: mongoose.Types.ObjectId;
  environment: PartnerEnvironment;
  reference: string;
  externalId: string | null;

  title: string;
  primaryArtist: string[];
  featuringArtists: string[];
  label: string | null;
  genre: string[];
  language: string | null;
  releaseDate: Date | null;
  isrc: string | null;
  isrcAssignedByPlatform: boolean;
  channel: string | null;
  description: string | null;
  keywords: string[];
  composer: string | null;
  producer: string | null;
  editor: string | null;
  musicDirector: string | null;
  copyrightYear: number | null;

  // The partner's own hosted source media — never shown back as `videoUrl`.
  sourceVideoUrl: string;
  imageUrl: string | null;
  // The live/delivered link. Null until status reaches `delivered`.
  videoUrl: string | null;

  status: PartnerReleaseStatus;
  statusDetail: string | null;
  reason: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const PartnerReleaseSchema = new Schema<IPartnerRelease>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    partnerKey: { type: Schema.Types.ObjectId, ref: 'PartnerKey', required: true },
    environment: { type: String, enum: ['live', 'test'], required: true, index: true },
    reference: { type: String, required: true, unique: true },
    externalId: { type: String, default: null },

    title: { type: String, required: true, trim: true },
    primaryArtist: { type: [String], required: true },
    featuringArtists: { type: [String], default: [] },
    label: { type: String, default: null },
    genre: { type: [String], default: [] },
    language: { type: String, default: null },
    releaseDate: { type: Date, default: null },
    isrc: { type: String, default: null },
    isrcAssignedByPlatform: { type: Boolean, default: false },
    channel: { type: String, default: null },
    description: { type: String, default: null },
    keywords: { type: [String], default: [] },
    composer: { type: String, default: null },
    producer: { type: String, default: null },
    editor: { type: String, default: null },
    musicDirector: { type: String, default: null },
    copyrightYear: { type: Number, default: null },

    sourceVideoUrl: { type: String, required: true },
    imageUrl: { type: String, default: null },
    videoUrl: { type: String, default: null },

    status: {
      type: String,
      enum: PARTNER_RELEASE_STATUSES,
      default: 'pending',
      index: true,
    },
    statusDetail: { type: String, default: 'Waiting for review.' },
    reason: { type: String, default: null },
  },
  { timestamps: true },
);

// Idempotency (§2.3/§5): a given account can never create two releases with
// the same externalId. Sparse because externalId is optional.
PartnerReleaseSchema.index({ user: 1, externalId: 1 }, { unique: true, sparse: true });
// Environment isolation must be enforceable at the query level on every list
// call — this compound index is what makes that cheap, not just correct.
PartnerReleaseSchema.index({ user: 1, environment: 1, updatedAt: -1 });

export const PartnerRelease = mongoose.model<IPartnerRelease>(
  'PartnerRelease',
  PartnerReleaseSchema,
);
