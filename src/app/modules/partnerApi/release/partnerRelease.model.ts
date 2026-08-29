import mongoose, { Schema } from 'mongoose';
import { PartnerEnvironment } from '../partnerApi.constants';

export const PARTNER_RELEASE_STATUSES = [
  'pending',
  'in_review',
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
  externalId: string | undefined;

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

  // Set once a *live* release is approved — the id of the Video document
  // created in the existing internal catalog so it flows through the same
  // admin catalogue, VEVO-transfer, and reporting tools every other video
  // already does. Always null for test-environment releases.
  catalogVideoId: mongoose.Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const PartnerReleaseSchema = new Schema<IPartnerRelease>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    partnerKey: { type: Schema.Types.ObjectId, ref: 'PartnerKey', required: true },
    environment: { type: String, enum: ['live', 'test'], required: true, index: true },
    reference: { type: String, required: true, unique: true },
    // Deliberately no `default: null` — a sparse index still counts an
    // explicit `null` as a real value, so every no-externalId release would
    // collide with every other one for the same user. Leaving the field
    // truly absent is what makes the sparse index only apply to releases
    // that actually have an externalId.
    externalId: { type: String },

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
    catalogVideoId: { type: Schema.Types.ObjectId, ref: 'Video', default: null },
  },
  { timestamps: true },
);

// Idempotency (§2.3/§5): a given account can never create two releases with
// the same externalId. A *partial* index, not `sparse` — a compound sparse
// index only excludes a document when EVERY indexed field is absent, and
// `user` is always present here, so a plain `sparse: true` would still index
// every externalId-less release as `externalId: null` and collide with the
// first one (mirrors the ISRC partial-index pattern in videos.model.ts).
PartnerReleaseSchema.index(
  { user: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $exists: true } } },
);
// Environment isolation must be enforceable at the query level on every list
// call — this compound index is what makes that cheap, not just correct.
PartnerReleaseSchema.index({ user: 1, environment: 1, updatedAt: -1 });

export const PartnerRelease = mongoose.model<IPartnerRelease>(
  'PartnerRelease',
  PartnerReleaseSchema,
);
