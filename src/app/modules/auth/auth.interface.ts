import { ENUM_USER_ROLE } from '../../../enums/user';

export type ILoginUser = {
  email: string;
  password: string;
};
export type IChangePassword = {
  oldPassword: string;
  confirmPassword: string;
  newPassword: string;
};
export type ILoginUserResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

// Result of a credential check, before cookies/2FA gating is applied.
export type ILoginResult = {
  subjectId: string;
  role: string;
  isVerified?: boolean;
  twoFactorEnabled: boolean;
};

export type IVerifiedLoginUser = {
  userId: string;
  role: ENUM_USER_ROLE;
};
