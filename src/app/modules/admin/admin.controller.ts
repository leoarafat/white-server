import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';
import { IUser } from '../user/user.interface';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { IAdmin } from './admin.interface';
import { IReqUser } from '../../../interfaces/common';
import { finishLogin } from '../security/security.service';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import {
  clearAuthCookies,
  getCookieNames,
  revokeSession,
  rotateSession,
  setAuthCookies,
} from '../../../helpers/authTokens';

const registerAdmin: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.registerAdmin(req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Super Admin Created`,
      data: result,
    });
  },
);

const createUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { ...userData } = req.body;

    const result = await AdminService.createUser(userData);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User created successfully',
      data: result,
    });
  },
);
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query);
  sendResponse<IUser[]>(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.getSingleUser(id);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});
const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateAdmin(req as any);
  sendResponse<IAdmin>(res, {
    statusCode: 200,
    success: true,
    message: 'Admin updated successfully',
    data: result,
  });
});
const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserProfile(req as any);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.deleteUser(id);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});
const login = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AdminService.login(loginData);

  const data = await finishLogin({
    req,
    res,
    subjectType: 'admin',
    subjectId: result.subjectId,
    role: result.role,
    twoFactorEnabled: result.twoFactorEnabled,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: data.requiresTwoFactor
      ? 'Enter your two-step verification code'
      : 'Admin loggedin successfully !',
    data,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[getCookieNames('admin').refresh];
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'No refresh token');
  }
  let tokens;
  try {
    tokens = await rotateSession(
      token,
      'admin',
      req,
      AdminService.resolveAdminForRefresh,
    );
  } catch {
    clearAuthCookies(res, 'admin');
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired');
  }
  setAuthCookies(res, 'admin', tokens);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Token refreshed',
    data: { success: true },
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[getCookieNames('admin').refresh];
  if (token) {
    const decoded = jwtHelpers.decodeToken(token);
    if (decoded?.sessionId) await revokeSession(decoded.sessionId);
  }
  clearAuthCookies(res, 'admin');
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged out',
  });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { ...passwordData } = req.body;

  await AdminService.changePassword(req.user as IReqUser, passwordData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password change successfully !',
  });
});

const myProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.myProfile(req.user as any);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const getAllAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllAdmin();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});
const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.deleteAdmin(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'successful!',
    data: result,
  });
});

export const AdminController = {
  createUser,
  getAllUsers,
  getSingleUser,
  deleteUser,
  registerAdmin,
  login,
  logout,
  changePassword,
  refreshToken,
  updateAdmin,
  myProfile,
  getAllAdmin,
  deleteAdmin,
  updateUserProfile,
};
