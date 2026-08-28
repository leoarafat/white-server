import { Model, Types } from 'mongoose';

export type SubjectType = 'user' | 'admin';

export type ISession = {
  _id?: string;
  sessionId: string;
  subjectId: Types.ObjectId;
  subjectType: SubjectType;
  role: string;
  refreshTokenHash: string;
  userAgent?: string;
  deviceLabel?: string;
  ip?: string;
  lastUsedAt: Date;
  revokedAt?: Date | null;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SessionModel = Model<ISession>;
