/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { Secret } from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import User from '../user/user.model';
import Admin from '../admin/admin.model';
import Passkey from './passkey.model';
import { SubjectType } from '../session/session.interface';
import {
  buildDeviceLabel,
  issueSession,
  listActiveSessions,
  revokeOtherSessions,
  setAuthCookies,
} from '../../../helpers/authTokens';

// In production use the configured registrable domain (e.g. arpmusic.com, which
// covers both backstage.* and internal.* subdomains). In dev, WebAuthn requires
// the RP ID to be `localhost` regardless of what's in .env.
const RP_ID =
  config.env === 'production' ? config.webauthn_rp_id || 'localhost' : 'localhost';
const RP_NAME = config.webauthn_rp_name || 'ARP Music';

const resolveModel = (subjectType: SubjectType): any =>
  subjectType === 'admin' ? Admin : User;

const getRequestOrigin = (req: Request) => {
  const origin = req.headers.origin;
  if (!origin) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing origin');
  return origin.replace(/\/$/, '');
};

const b64urlToBuffer = (value: string) => Buffer.from(value, 'base64url');
const bufferToB64url = (buf: Uint8Array) => Buffer.from(buf).toString('base64url');

// ─────────────────────────────── 2FA (TOTP) ────────────────────────────────

export const setup2FA = async (subjectType: SubjectType, subjectId: string) => {
  const Model = resolveModel(subjectType);
  const subject = await Model.findById(subjectId);
  if (!subject) throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');
  if (subject.twoFactor?.enabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Two-step sign-in already on');
  }

  const secret = authenticator.generateSecret();
  // Store the pending (not-yet-enabled) secret so verify-enable can confirm it.
  await Model.updateOne(
    { _id: subjectId },
    { $set: { 'twoFactor.secret': secret, 'twoFactor.enabled': false } },
  );

  const otpauthUrl = authenticator.keyuri(
    subject.email || 'account',
    RP_NAME,
    secret,
  );
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, otpauthUrl, qrDataUrl };
};

const hashBackupCode = (code: string) =>
  crypto.createHash('sha256').update(code).digest('hex');

const generateBackupCodes = () => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    codes.push(crypto.randomBytes(5).toString('hex')); // 10-char codes
  }
  return codes;
};

export const verifyEnable2FA = async (
  subjectType: SubjectType,
  subjectId: string,
  code: string,
) => {
  const Model = resolveModel(subjectType);
  const subject = await Model.findById(subjectId).select('+twoFactor.secret');
  if (!subject?.twoFactor?.secret) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Start setup first');
  }
  const ok = authenticator.verify({ token: code, secret: subject.twoFactor.secret });
  if (!ok) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid code');

  const backupCodes = generateBackupCodes();
  await Model.updateOne(
    { _id: subjectId },
    {
      $set: {
        'twoFactor.enabled': true,
        'twoFactor.backupCodes': backupCodes.map(hashBackupCode),
      },
    },
  );
  return { backupCodes };
};

export const disable2FA = async (
  subjectType: SubjectType,
  subjectId: string,
  password: string,
  code: string,
) => {
  const Model = resolveModel(subjectType);
  const subject = await Model.findById(subjectId)
    .select('+password')
    .select('+twoFactor.secret');
  if (!subject) throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');
  if (!subject.twoFactor?.enabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Two-step sign-in is off');
  }

  const passwordOk = subject.password
    ? await bcrypt.compare(password, subject.password)
    : false;
  if (!passwordOk) throw new ApiError(httpStatus.BAD_REQUEST, 'Password is incorrect');

  const codeOk = authenticator.verify({
    token: code,
    secret: subject.twoFactor.secret,
  });
  if (!codeOk) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid code');

  await Model.updateOne(
    { _id: subjectId },
    {
      $set: {
        'twoFactor.enabled': false,
        'twoFactor.secret': null,
        'twoFactor.backupCodes': [],
      },
    },
  );
};

// Verify a submitted TOTP or single-use backup code during login.
const verifyTwoFactorCode = async (
  Model: any,
  subjectId: string,
  code: string,
) => {
  const subject = await Model.findById(subjectId)
    .select('+twoFactor.secret')
    .select('+twoFactor.backupCodes');
  if (!subject?.twoFactor?.enabled || !subject.twoFactor.secret) return false;

  if (authenticator.verify({ token: code, secret: subject.twoFactor.secret })) {
    return true;
  }
  // Fall back to one-time backup codes.
  const hashed = hashBackupCode(code);
  const stored: string[] = subject.twoFactor.backupCodes || [];
  if (stored.includes(hashed)) {
    await Model.updateOne(
      { _id: subjectId },
      { $pull: { 'twoFactor.backupCodes': hashed } },
    );
    return true;
  }
  return false;
};

// ─────────────────────── Login completion (2FA gate) ────────────────────────

// Called by login controllers after credentials verify. Either issues cookies
// or returns a short-lived tempToken that /2fa/login-verify will exchange.
export const finishLogin = async ({
  req,
  res,
  subjectType,
  subjectId,
  role,
  twoFactorEnabled,
  extraAccessClaims,
  extraBody,
}: {
  req: Request;
  res: Response;
  subjectType: SubjectType;
  subjectId: string;
  role: string;
  twoFactorEnabled: boolean;
  extraAccessClaims?: Record<string, unknown>;
  extraBody?: Record<string, unknown>;
}) => {
  if (twoFactorEnabled) {
    const tempToken = jwtHelpers.createToken(
      { userId: subjectId, subjectType, role, twofa: true },
      config.jwt.secret as Secret,
      '5m',
    );
    return { requiresTwoFactor: true, tempToken };
  }

  const tokens = await issueSession({
    subjectId,
    role,
    subjectType,
    req,
    extraAccessClaims,
  });
  setAuthCookies(res, subjectType, tokens);
  return { requiresTwoFactor: false, ...(extraBody || {}) };
};

export const verify2FALogin = async (
  req: Request,
  res: Response,
  tempToken: string,
  code: string,
) => {
  let decoded: any;
  try {
    decoded = jwtHelpers.verifyToken(tempToken, config.jwt.secret as Secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired, sign in again');
  }
  if (!decoded?.twofa) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid verification token');
  }

  const subjectType: SubjectType = decoded.subjectType;
  const Model = resolveModel(subjectType);
  const ok = await verifyTwoFactorCode(Model, decoded.userId, code);
  if (!ok) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid code');

  const subject = await Model.findById(decoded.userId);
  const extraAccessClaims =
    subjectType === 'user' ? { isVerified: subject?.isVerified } : {};

  const tokens = await issueSession({
    subjectId: decoded.userId,
    role: decoded.role,
    subjectType,
    req,
    extraAccessClaims,
  });
  setAuthCookies(res, subjectType, tokens);
  return { isVerified: subject?.isVerified };
};

export const getTwoFactorStatus = async (
  subjectType: SubjectType,
  subjectId: string,
) => {
  const Model = resolveModel(subjectType);
  const subject = await Model.findById(subjectId).lean();
  return { enabled: Boolean(subject?.twoFactor?.enabled) };
};

// ───────────────────────────── Passkeys (WebAuthn) ──────────────────────────

export const passkeyRegisterOptions = async (
  subjectType: SubjectType,
  subjectId: string,
) => {
  const Model = resolveModel(subjectType);
  const subject = await Model.findById(subjectId).lean();
  if (!subject) throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');

  const existing = await Passkey.find({ subjectId, subjectType }).lean();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(String(subjectId)),
    userName: subject.email || 'account',
    attestationType: 'none',
    excludeCredentials: existing.map(c => ({ id: c.credentialId })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  const challengeToken = jwtHelpers.createToken(
    { challenge: options.challenge, subjectId, subjectType, purpose: 'reg' },
    config.jwt.secret as Secret,
    '5m',
  );
  return { options, challengeToken };
};

export const passkeyRegisterVerify = async (
  req: Request,
  subjectType: SubjectType,
  subjectId: string,
  challengeToken: string,
  attResponse: any,
) => {
  let decoded: any;
  try {
    decoded = jwtHelpers.verifyToken(challengeToken, config.jwt.secret as Secret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Challenge expired, try again');
  }
  if (
    decoded.purpose !== 'reg' ||
    String(decoded.subjectId) !== String(subjectId) ||
    decoded.subjectType !== subjectType
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid challenge');
  }

  const verification = await verifyRegistrationResponse({
    response: attResponse,
    expectedChallenge: decoded.challenge,
    expectedOrigin: getRequestOrigin(req),
    expectedRPID: RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Passkey registration failed');
  }

  const { credential } = verification.registrationInfo;
  await Passkey.create({
    subjectId,
    subjectType,
    credentialId: credential.id,
    publicKey: bufferToB64url(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports || [],
    deviceLabel: buildDeviceLabel(req.headers['user-agent'] || ''),
  });
  return { verified: true };
};

export const passkeyLoginOptions = async (
  subjectType: SubjectType,
  email: string,
) => {
  const Model = resolveModel(subjectType);
  const subject = await Model.findOne({ email }).lean();
  if (!subject) throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');

  const credentials = await Passkey.find({
    subjectId: subject._id,
    subjectType,
  }).lean();
  if (!credentials.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No passkeys registered');
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: credentials.map(c => ({
      id: c.credentialId,
      transports: c.transports as any,
    })),
    userVerification: 'preferred',
  });

  const challengeToken = jwtHelpers.createToken(
    {
      challenge: options.challenge,
      subjectId: String(subject._id),
      subjectType,
      role: subject.role,
      purpose: 'auth',
    },
    config.jwt.secret as Secret,
    '5m',
  );
  return { options, challengeToken };
};

export const passkeyLoginVerify = async (
  req: Request,
  res: Response,
  subjectType: SubjectType,
  challengeToken: string,
  authResponse: any,
) => {
  let decoded: any;
  try {
    decoded = jwtHelpers.verifyToken(challengeToken, config.jwt.secret as Secret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Challenge expired, try again');
  }
  if (decoded.purpose !== 'auth' || decoded.subjectType !== subjectType) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid challenge');
  }

  const passkey = await Passkey.findOne({
    credentialId: authResponse.id,
    subjectId: decoded.subjectId,
    subjectType,
  });
  if (!passkey) throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown passkey');

  const verification = await verifyAuthenticationResponse({
    response: authResponse,
    expectedChallenge: decoded.challenge,
    expectedOrigin: getRequestOrigin(req),
    expectedRPID: RP_ID,
    credential: {
      id: passkey.credentialId,
      publicKey: b64urlToBuffer(passkey.publicKey),
      counter: passkey.counter,
      transports: passkey.transports as any,
    },
  });

  if (!verification.verified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Passkey verification failed');
  }

  passkey.counter = verification.authenticationInfo.newCounter;
  await passkey.save();

  const Model = resolveModel(subjectType);
  const subject = await Model.findById(decoded.subjectId);
  const extraAccessClaims =
    subjectType === 'user' ? { isVerified: subject?.isVerified } : {};

  const tokens = await issueSession({
    subjectId: decoded.subjectId,
    role: decoded.role,
    subjectType,
    req,
    extraAccessClaims,
  });
  setAuthCookies(res, subjectType, tokens);
  return { isVerified: subject?.isVerified, role: decoded.role };
};

export const listPasskeys = async (
  subjectType: SubjectType,
  subjectId: string,
) => {
  const rows = await Passkey.find({ subjectId, subjectType })
    .select('credentialId deviceLabel createdAt')
    .sort({ createdAt: -1 })
    .lean();
  return rows.map(r => ({
    id: r._id,
    deviceLabel: r.deviceLabel,
    createdAt: r.createdAt,
  }));
};

export const deletePasskey = async (
  subjectType: SubjectType,
  subjectId: string,
  passkeyId: string,
) => {
  await Passkey.deleteOne({ _id: passkeyId, subjectId, subjectType });
};

// ─────────────────────────────── Sessions ───────────────────────────────────

export const getSessions = async (
  subjectType: SubjectType,
  subjectId: string,
  currentSessionId: string,
) => {
  const sessions = await listActiveSessions(subjectId, subjectType);
  return sessions.map(s => ({
    id: s.sessionId,
    deviceLabel: s.deviceLabel,
    ip: s.ip,
    lastUsedAt: s.lastUsedAt,
    createdAt: s.createdAt,
    current: s.sessionId === currentSessionId,
  }));
};

export const signOutOtherSessions = async (
  subjectType: SubjectType,
  subjectId: string,
  currentSessionId: string,
) => {
  await revokeOtherSessions(subjectId, subjectType, currentSessionId);
};
