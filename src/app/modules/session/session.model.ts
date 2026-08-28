import { Schema, model } from 'mongoose';
import { ISession, SessionModel } from './session.interface';

const SessionSchema = new Schema<ISession, SessionModel>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    subjectType: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    deviceLabel: {
      type: String,
    },
    ip: {
      type: String,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    // TTL: Mongo auto-removes the doc once expiresAt passes.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-expire sessions once the refresh token would have expired anyway.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = model<ISession, SessionModel>('Session', SessionSchema);

export default Session;
