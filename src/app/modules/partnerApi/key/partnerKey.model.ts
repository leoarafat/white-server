import mongoose, { Schema } from 'mongoose';
import { PARTNER_SCOPES, PartnerEnvironment, PartnerScope } from '../partnerApi.constants';

export interface IPartnerKey {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  label: string;
  environment: PartnerEnvironment;
  scopes: PartnerScope[];
  keyHash: string;
  keyPrefix: string;
  ipAllowlist: string[];
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerKeySchema = new Schema<IPartnerKey>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true },
    environment: { type: String, enum: ['live', 'test'], required: true },
    scopes: { type: [String], enum: PARTNER_SCOPES, default: [] },
    // Only the hash is ever persisted — the plaintext key is returned once,
    // on the creation response, and never stored or re-servable after that.
    keyHash: { type: String, required: true, unique: true, select: false },
    keyPrefix: { type: String, required: true },
    ipAllowlist: { type: [String], default: [] },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

PartnerKeySchema.index({ user: 1, environment: 1 });

export const PartnerKey = mongoose.model<IPartnerKey>('PartnerKey', PartnerKeySchema);
