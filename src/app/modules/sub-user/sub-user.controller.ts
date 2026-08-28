import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { SubUserService } from './sub-user.service';
import { IUser } from '../user/user.interface';
import { finishLogin } from '../security/security.service';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import {
  clearAuthCookies,
  getCookieNames,
  issueSession,
  revokeSession,
  rotateSession,
  setAuthCookies,
} from '../../../helpers/authTokens';

const registrationUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubUserService.registrationSubUser(req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Please check your email: ${result?.user?.email} to active your account`,
      activationToken: result.activationToken,
    });
  },
);
const activateUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubUserService.activateUser(req.body);
    const tokens = await issueSession({
      subjectId: result.subjectId,
      role: result.role,
      subjectType: 'user',
      req,
      extraAccessClaims: { isVerified: result.isVerified },
    });
    setAuthCookies(res, 'user', tokens);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Sub User activate successful',
      data: { isVerified: result.isVerified },
    });
  },
);

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  //@ts-ignore
  const requesterId = req.user?.userId?.toString();
  const result = await SubUserService.getAllUsers(requesterId);
  sendResponse<IUser[]>(res, {
    statusCode: 200,
    success: true,
    message: 'SUb User retrieved successfully',
    data: result,
  });
});
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  //@ts-ignore
  const requesterId = req.user?.userId?.toString();
  const result = await SubUserService.getSingleUser(id, requesterId);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'Sub User retrieved successfully',
    data: result,
  });
});
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  //@ts-ignore
  const requesterId = req.user?.userId?.toString();
  const result = await SubUserService.updateUser(id, req, requesterId);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'SUb User updated successfully',
    data: result,
  });
});
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  //@ts-ignore
  const requesterId = req.user?.userId?.toString();
  const result = await SubUserService.deleteUser(id, requesterId);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'SUb User deleted successfully',
    data: result,
  });
});
const login = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await SubUserService.login(loginData);

  const data = await finishLogin({
    req,
    res,
    subjectType: 'user',
    subjectId: result.subjectId,
    role: result.role,
    twoFactorEnabled: result.twoFactorEnabled,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SUb User loggedin successfully !',
    data,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[getCookieNames('user').refresh];
  if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, 'No refresh token');
  let tokens;
  try {
    tokens = await rotateSession(
      token,
      'user',
      req,
      SubUserService.resolveUserForRefresh,
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

const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[getCookieNames('user').refresh];
  if (token) {
    const decoded = jwtHelpers.decodeToken(token);
    if (decoded?.sessionId) await revokeSession(decoded.sessionId);
  }
  clearAuthCookies(res, 'user');
  sendResponse(res, { statusCode: 200, success: true, message: 'Logged out' });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { ...passwordData } = req.body;
  const user = req.user;
  await SubUserService.changePassword(user, passwordData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password change successfully !',
  });
});
export const SubUserController = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  registrationUser,
  activateUser,
  login,
  logout,
  changePassword,
  refreshToken,
};
