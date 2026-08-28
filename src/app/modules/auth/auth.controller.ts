import { Request, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchasync';
import { finishLogin } from '../security/security.service';
import {
  clearAuthCookies,
  getCookieNames,
  rotateSession,
  setAuthCookies,
} from '../../../helpers/authTokens';

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUser(loginData);

  const data = await finishLogin({
    req,
    res,
    subjectType: 'user',
    subjectId: result.subjectId,
    role: result.role,
    twoFactorEnabled: result.twoFactorEnabled,
    extraAccessClaims: { isVerified: result.isVerified },
    extraBody: { isVerified: result.isVerified },
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: data.requiresTwoFactor
      ? 'Enter your two-step verification code'
      : 'User loggedin successfully !',
    data,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[getCookieNames('user').refresh];
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'No refresh token');
  }
  let tokens;
  try {
    tokens = await rotateSession(
      token,
      'user',
      req,
      AuthService.resolveUserForRefresh,
    );
  } catch {
    clearAuthCookies(res, 'user');
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired');
  }
  setAuthCookies(res, 'user', tokens);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Token refreshed',
    data: { success: true },
  });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { ...passwordData } = req.body;
  const user = req.user;
  await AuthService.changePassword(user, passwordData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password change successfully !',
  });
});
const forgotPass = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPass(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Check your email!',
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization || '';
  await AuthService.resetPassword(req.body, token);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account recovered!',
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPass,
  resetPassword,
};
