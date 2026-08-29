import mongoose, { Schema } from 'mongoose';
import { PartnerEnvironment } from '../partnerApi.constants';

export interface IPartnerWebhook {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  environment: PartnerEnvironment;
  url: string;
  // The signing secret must be recoverable server-side (every delivery is
  // signed with it) so — unlike an API key — it can't just be a one-way
  // hash. Its safety comes entirely from `select: false` plus the fact it
  // is never included in any read response, only the one-time set/rotate
  // response body.
  secret: string;
  // Kept live for a transition window after a rotation so in-flight
  // integrations don't break the moment they rotate (§2.7).
  previousSecret: string | null;
  previousSecretExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerWebhookSchema = new Schema<IPartnerWebhook>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    environment: { type: String, enum: ['live', 'test'], required: true },
    url: { type: String, required: true },
    secret: { type: String, required: true, select: false },
    previousSecret: { type: String, default: null, select: false },
    previousSecretExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

PartnerWebhookSchema.index({ user: 1, environment: 1 }, { unique: true });

export const PartnerWebhook = mongoose.model<IPartnerWebhook>(
  'PartnerWebhook',
  PartnerWebhookSchema,
);
