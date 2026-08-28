/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { SubjectType } from '../session/session.interface';
import * as SecurityService from './security.service';

const subjectTypeFromReq = (req: Request): SubjectType => {
  const claim = (req.user as any)?.subjectType;
  if (claim === 'admin' || claim === 'user') return claim;
  const role = (req.user as any)?.role;
  return role === 'admin' || role === 'super-admin' ? 'admin' : 'user';
};

const subjectIdFromReq = (req: Request) => String((req.user as any)?.userId);
const sessionIdFromReq = (req: Request) => String((req.user as any)?.sessionId || '');

// ── 2FA ──────────────────────────────────────────────────────────────────────
const twoFAStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.getTwoFactorStatus(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

const setup2FA = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.setup2FA(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Scan the QR code', data });
});

const verifyEnable2FA = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.verifyEnable2FA(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
    req.body.code,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Two-step sign-in enabled', data });
});

const disable2FA = catchAsync(async (req: Request, res: Response) => {
  await SecurityService.disable2FA(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
    req.body.password,
    req.body.code,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Two-step sign-in disabled' });
});

const loginVerify2FA = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.verify2FALogin(
    req,
    res,
    req.body.tempToken,
    req.body.code,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Login successful', data });
});

// ── Passkeys ─────────────────────────────────────────────────────────────────
const passkeyRegisterOptions = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.passkeyRegisterOptions(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

const passkeyRegisterVerify = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.passkeyRegisterVerify(
    req,
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
    req.body.challengeToken,
    req.body.response,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Passkey added', data });
});

const passkeyLoginOptions = catchAsync(async (req: Request, res: Response) => {
  const subjectType: SubjectType =
    req.body.subjectType === 'admin' ? 'admin' : 'user';
  const data = await SecurityService.passkeyLoginOptions(subjectType, req.body.email);
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

const passkeyLoginVerify = catchAsync(async (req: Request, res: Response) => {
  const subjectType: SubjectType =
    req.body.subjectType === 'admin' ? 'admin' : 'user';
  const data = await SecurityService.passkeyLoginVerify(
    req,
    res,
    subjectType,
    req.body.challengeToken,
    req.body.response,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Login successful', data });
});

const listPasskeys = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.listPasskeys(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

const deletePasskey = catchAsync(async (req: Request, res: Response) => {
  await SecurityService.deletePasskey(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
    req.params.id,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Passkey removed' });
});

// ── Sessions ─────────────────────────────────────────────────────────────────
const getSessions = catchAsync(async (req: Request, res: Response) => {
  const data = await SecurityService.getSessions(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
    sessionIdFromReq(req),
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'OK', data });
});

const revokeOtherSessions = catchAsync(async (req: Request, res: Response) => {
  await SecurityService.signOutOtherSessions(
    subjectTypeFromReq(req),
    subjectIdFromReq(req),
    sessionIdFromReq(req),
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Signed out everywhere else' });
});

export const SecurityController = {
  twoFAStatus,
  setup2FA,
  verifyEnable2FA,
  disable2FA,
  loginVerify2FA,
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  passkeyLoginOptions,
  passkeyLoginVerify,
  listPasskeys,
  deletePasskey,
  getSessions,
  revokeOtherSessions,
};
