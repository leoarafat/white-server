import { Schema, model, Model, Types } from 'mongoose';

// One-time exchange code an admin hands to the user app to impersonate a user.
export type IImpersonationTicket = {
  _id?: string;
  codeHash: string;
  targetUserId: Types.ObjectId;
  adminId: Types.ObjectId;
  usedAt?: Date | null;
  expiresAt: Date;
  createdAt?: Date;
};

const ImpersonationTicketSchema = new Schema<IImpersonationTicket>(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
ImpersonationTicketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ImpersonationTicket: Model<IImpersonationTicket> =
  model<IImpersonationTicket>('ImpersonationTicket', ImpersonationTicketSchema);

// Permanent audit trail of who impersonated whom.
export type IImpersonationLog = {
  _id?: string;
  adminId: Types.ObjectId;
  targetUserId: Types.ObjectId;
  ip?: string;
  userAgent?: string;
  createdAt?: Date;
};

const ImpersonationLogSchema = new Schema<IImpersonationLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

export const ImpersonationLog: Model<IImpersonationLog> =
  model<IImpersonationLog>('ImpersonationLog', ImpersonationLogSchema);
