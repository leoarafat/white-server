import crypto from 'crypto';
import { Request, RequestHandler, Response } from 'express';
import { UserService } from './user.service';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from './user.interface';
import catchAsync from '../../../shared/catchasync';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { IReqUser } from '../../../interfaces/common';
import { finishLogin } from '../security/security.service';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import {
  clearAuthCookies,
  getClientIp,
  getCookieNames,
  issueSession,
  revokeSession,
  rotateSession,
  setAuthCookies,
} from '../../../helpers/authTokens';
import User from './user.model';
import {
  ImpersonationLog,
  ImpersonationTicket,
} from '../security/impersonation.model';

const registrationUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.registrationUser(req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Please check your email: ${result?.user?.email} to active your account`,
      activationToken: result.activationToken,
    });
  },
);
const createSubUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.createSubUser(
      req.body,
      req.user as IReqUser,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Sub User Added`,
      data: result,
    });
  },
);
const profileVerification: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.profileVerification(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Profile updated`,
      data: result,
    });
  },
);
const labelVerification: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.labelVerification(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Label updated`,
      data: result,
    });
  },
);
const signatureVerification: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.signatureVerification(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Signature updated`,
      data: result,
    });
  },
);
const activateUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.activateUser(req.body);
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
      message: 'User activate successful',
      data: { user: result.user, isVerified: result.isVerified },
    });
  },
);

const createUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { ...userData } = req.body;

    const result = await UserService.createUser(userData);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User created successfully',
      data: result,
    });
  },
);
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);
  sendResponse<IUser[]>(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});
const exportUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.exportUsers();
  sendResponse<IUser[]>(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getSingleUser(req.user as IReqUser);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateUser(req);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await UserService.deleteUser(id);
  sendResponse<IUser>(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});
const login = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await UserService.loginUser(loginData);

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
      UserService.resolveUserForRefresh,
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
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged out',
  });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { ...passwordData } = req.body;
  await UserService.changePassword(req.user as IReqUser, passwordData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password change successfully !',
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Address update successfully',
    data: result,
  });
});
const updateProfilePicture = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateProfilePicture(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile Picture update successfully',
    data: result,
  });
});
const mySubUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.mySubUser(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Retrieved successfully',
    data: result,
  });
});
// Admin requests a short-lived one-time code to impersonate a user. The code
// (not a token) travels to the user app, which exchanges it for a real session.
const loginUserFromAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.body;
  const admin = req.user as IReqUser;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  // Random opaque code; only its hash is stored, 60s TTL, single use.
  const code = crypto.randomBytes(32).toString('hex');
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  await ImpersonationTicket.create({
    codeHash,
    targetUserId: targetUser._id,
    adminId: admin.userId,
    expiresAt: new Date(Date.now() + 60 * 1000),
  });

  await ImpersonationLog.create({
    adminId: admin.userId,
    targetUserId: targetUser._id,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || '',
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Impersonation code issued',
    data: { code },
  });
});

// User app posts the one-time code; we burn it and set that user's cookies.
const exchangeImpersonationCode = catchAsync(
  async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing code');

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    // Atomically claim the ticket so a code can never be used twice.
    const ticket = await ImpersonationTicket.findOneAndUpdate(
      { codeHash, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true },
    );
    if (!ticket) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid or expired impersonation code',
      );
    }

    const targetUser = await User.findById(ticket.targetUserId);
    if (!targetUser) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
    }

    const tokens = await issueSession({
      subjectId: String(targetUser._id),
      role: targetUser.role,
      subjectType: 'user',
      req,
      extraAccessClaims: { isVerified: targetUser.isVerified, impersonated: true },
    });
    setAuthCookies(res, 'user', tokens);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Impersonation session started',
      data: { isVerified: targetUser.isVerified },
    });
  },
);
const addClientImage: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.addClientImage(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Image updated`,
      data: result,
    });
  },
);
const givePermission: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.givePermission(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Permission updated`,
      data: result,
    });
  },
);
const getUserById: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.getUserById(
      req.params.id,
      //@ts-ignore
      req.user?.userId?.toString(),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Success`,
      data: result,
    });
  },
);
export const UserController = {
  createUser,
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
  loginUserFromAdmin,
  exchangeImpersonationCode,
  updateProfile,
  profileVerification,
  labelVerification,
  signatureVerification,
  updateProfilePicture,
  createSubUser,
  mySubUser,
  addClientImage,
  givePermission,
  getUserById,
  exportUsers,
};
