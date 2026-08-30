import { z } from 'zod';
import { objectId, requiredString } from '../../../shared/zodCommon';

const registrationUserSchema = z.object({
  body: z.object({
    name: requiredString('Name'),
    email: requiredString('Email').email('A valid email is required'),
    password: requiredString('Password').min(
      6,
      'Password must be at least 6 characters',
    ),
    phoneNumber: z.string().trim().optional(),
  }),
});

const createSubUserSchema = z.object({
  body: z.object({
    name: requiredString('Name'),
    email: requiredString('Email').email('A valid email is required'),
    password: requiredString('Password').min(
      6,
      'Password must be at least 6 characters',
    ),
    phoneNumber: z.string().trim().optional(),
  }),
});

const activateUserSchema = z.object({
  body: z.object({
    activation_code: requiredString('activation_code'),
    activation_token: requiredString('activation_token'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: requiredString('Email').email('A valid email is required'),
    password: requiredString('Password'),
  }),
});

const loginFromAdminSchema = z.object({
  body: z.object({
    id: objectId(),
  }),
});

const exchangeImpersonationCodeSchema = z.object({
  body: z.object({
    code: requiredString('code'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: requiredString('oldPassword'),
    newPassword: requiredString('newPassword').min(
      6,
      'Password must be at least 6 characters',
    ),
    confirmPassword: requiredString('confirmPassword'),
  }),
});

// Identity/KYC fields — kept USER-only (not opened to SUB_USER), see
// user.routes.ts.
const profileVerificationSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    phoneNumber: z.string().trim().optional(),
    nidNumber: z.string().trim().optional(),
  }),
});

const labelVerificationSchema = z.object({
  body: z.object({
    channelUrl: z.string().trim().optional(),
    channelName: z.string().trim().optional(),
    currentDistributor: z.string().trim().optional(),
    howHereUs: z.string().trim().optional(),
  }),
});

const addressVerifySchema = z.object({
  body: z.object({
    address: z.string().trim().optional(),
    country: z.string().trim().optional(),
    state: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postCode: z.string().trim().optional(),
  }),
});

const addClientImageSchema = z.object({
  body: z.object({
    id: objectId(),
  }),
});

const givePermissionSchema = z.object({
  body: z.object({
    selectedUserId: objectId('selectedUserId'),
    selectedPermissions: z.array(z.string()).optional(),
    assignedLabels: z.array(z.string()).optional(),
    assignedArtists: z.array(z.string()).optional(),
    assignedChannels: z.array(z.string()).optional(),
    masterShareRate: z.string().trim().optional(),
    revenueRate: z.string().trim().optional(),
  }),
});

export const UserZodSchema = {
  registrationUserSchema,
  createSubUserSchema,
  activateUserSchema,
  loginSchema,
  loginFromAdminSchema,
  exchangeImpersonationCodeSchema,
  changePasswordSchema,
  profileVerificationSchema,
  labelVerificationSchema,
  addressVerifySchema,
  addClientImageSchema,
  givePermissionSchema,
};
