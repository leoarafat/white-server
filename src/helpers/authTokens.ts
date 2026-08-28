/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { Request, Response } from 'express';
import { Secret } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';
import config from '../config';
import { jwtHelpers } from './jwtHelpers';
import Session from '../app/modules/session/session.model';
import { SubjectType } from '../app/modules/session/session.interface';

// Distinct cookie names per subject type so an admin and a user logged in on the
// same host (e.g. both on localhost in dev) never clobber each other's session.
const COOKIE_NAMES: Record<SubjectType, { access: string; refresh: string }> = {
  user: { access: 'an_at', refresh: 'an_rt' },
  admin: { access: 'an_admin_at', refresh: 'an_admin_rt' },
};

export const getCookieNames = (subjectType: SubjectType) =>
  COOKIE_NAMES[subjectType];

// SameSite=None + Secure works cross-site AND on http://localhost (Chrome treats
// localhost as a secure context), so one config covers dev and prod white-label.
const baseCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
});

// Parse a jsonwebtoken-style duration ("30d", "15m", "365d", "45s") into ms.
export const durationToMs = (value: string | undefined, fallbackMs: number) => {
  if (!value) return fallbackMs;
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2] || 's';
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
};

const accessMaxAge = () =>
  durationToMs(config.jwt.expires_in as string, 30 * 24 * 60 * 60 * 1000);
const refreshMaxAge = () =>
  durationToMs(config.jwt.refresh_expires_in as string, 365 * 24 * 60 * 60 * 1000);

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const buildDeviceLabel = (userAgent?: string) => {
  if (!userAgent) return 'Unknown device';
  const parsed = UAParser(userAgent);
  const browser = parsed.browser.name || 'Unknown browser';
  const os = parsed.os.name || 'Unknown OS';
  return `${browser} on ${os}`;
};

export const getClientIp = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
};

type IssueParams = {
  subjectId: any;
  role: string;
  subjectType: SubjectType;
  req: Request;
  // Extra claims to embed in the access token (e.g. isVerified for the user app).
  extraAccessClaims?: Record<string, unknown>;
};

// Create a Session doc + signed access/refresh tokens for a fresh login.
export const issueSession = async ({
  subjectId,
  role,
  subjectType,
  req,
  extraAccessClaims = {},
}: IssueParams) => {
  const sessionId = uuidv4();

  const accessToken = jwtHelpers.createToken(
    { userId: subjectId, role, sessionId, subjectType, ...extraAccessClaims },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );
  const refreshToken = jwtHelpers.createToken(
    { userId: subjectId, role, sessionId, subjectType, jti: uuidv4() },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  const userAgent = req.headers['user-agent'] || '';

  await Session.create({
    sessionId,
    subjectId,
    subjectType,
    role,
    refreshTokenHash: hashToken(refreshToken),
    userAgent,
    deviceLabel: buildDeviceLabel(userAgent),
    ip: getClientIp(req),
    lastUsedAt: new Date(),
    expiresAt: new Date(Date.now() + refreshMaxAge()),
  });

  return { accessToken, refreshToken, sessionId };
};

// Verify + rotate a refresh token, returning fresh tokens. Throws on any
// invalid/revoked/expired/reused state.
export const rotateSession = async (
  refreshToken: string,
  subjectType: SubjectType,
  req: Request,
  resolveSubject: (subjectId: string) => Promise<{
    role: string;
    extraAccessClaims?: Record<string, unknown>;
  } | null>,
) => {
  let decoded: any;
  try {
    decoded = jwtHelpers.verifyToken(
      refreshToken,
      config.jwt.refresh_secret as Secret,
    );
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const { userId, sessionId } = decoded;
  if (!sessionId) throw new Error('INVALID_REFRESH_TOKEN');

  const session = await Session.findOne({ sessionId });
  if (
    !session ||
    session.subjectType !== subjectType ||
    session.revokedAt ||
    session.expiresAt.getTime() < Date.now() ||
    session.refreshTokenHash !== hashToken(refreshToken)
  ) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const subject = await resolveSubject(userId);
  if (!subject) throw new Error('SUBJECT_NOT_FOUND');

  const newAccessToken = jwtHelpers.createToken(
    {
      userId,
      role: subject.role,
      sessionId,
      subjectType,
      ...(subject.extraAccessClaims || {}),
    },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );
  const newRefreshToken = jwtHelpers.createToken(
    { userId, role: subject.role, sessionId, subjectType, jti: uuidv4() },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  session.refreshTokenHash = hashToken(newRefreshToken);
  session.lastUsedAt = new Date();
  session.ip = getClientIp(req);
  await session.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, sessionId };
};

export const setAuthCookies = (
  res: Response,
  subjectType: SubjectType,
  tokens: { accessToken: string; refreshToken: string },
) => {
  const names = COOKIE_NAMES[subjectType];
  res.cookie(names.access, tokens.accessToken, {
    ...baseCookieOptions(),
    maxAge: accessMaxAge(),
  });
  res.cookie(names.refresh, tokens.refreshToken, {
    ...baseCookieOptions(),
    maxAge: refreshMaxAge(),
  });
};

export const clearAuthCookies = (res: Response, subjectType: SubjectType) => {
  const names = COOKIE_NAMES[subjectType];
  const opts = baseCookieOptions();
  res.clearCookie(names.access, opts);
  res.clearCookie(names.refresh, opts);
  // Also clear the legacy cookie set by the old implementation.
  res.clearCookie('refreshToken', opts);
};

export const revokeSession = async (sessionId: string) => {
  if (!sessionId) return;
  await Session.updateOne(
    { sessionId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};

export const revokeOtherSessions = async (
  subjectId: any,
  subjectType: SubjectType,
  keepSessionId: string,
) => {
  await Session.updateMany(
    {
      subjectId,
      subjectType,
      sessionId: { $ne: keepSessionId },
      revokedAt: null,
    },
    { $set: { revokedAt: new Date() } },
  );
};

export const listActiveSessions = async (
  subjectId: any,
  subjectType: SubjectType,
) => {
  return Session.find({
    subjectId,
    subjectType,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsedAt: -1 })
    .lean();
};
