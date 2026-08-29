import mongoose, { Schema } from 'mongoose';
import { PartnerEnvironment } from '../partnerApi.constants';

export interface IPartnerActivityLog {
  _id: mongoose.Types.ObjectId;
  partnerKey: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  environment: PartnerEnvironment;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  ip: string;
  createdAt: Date;
}

const PartnerActivityLogSchema = new Schema<IPartnerActivityLog>(
  {
    partnerKey: { type: Schema.Types.ObjectId, ref: 'PartnerKey', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    environment: { type: String, enum: ['live', 'test'], required: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    latencyMs: { type: Number, required: true },
    ip: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

PartnerActivityLogSchema.index({ createdAt: -1 });

export const PartnerActivityLog = mongoose.model<IPartnerActivityLog>(
  'PartnerActivityLog',
  PartnerActivityLogSchema,
);
