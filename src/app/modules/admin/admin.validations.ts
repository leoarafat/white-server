import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const registerAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    email: requiredString('Email').email('A valid email is required'),
    password: requiredString('Password').min(
      6,
      'Password must be at least 6 characters',
    ),
    phoneNumber: z.string().trim().optional(),
  }),
});

const createUserSchema = z.object({
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

const updateAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    phoneNumber: z.string().trim().optional(),
  }),
});

// Admin editing an arbitrary user's profile — broad partial covering the
// fields user.model.ts exposes for admin management.
const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    phoneNumber: z.string().trim().optional(),
    address: z.string().trim().optional(),
    country: z.string().trim().optional(),
    state: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postCode: z.string().trim().optional(),
    channelName: z.string().trim().optional(),
    channelUrl: z.string().trim().optional(),
    currentDistributor: z.string().trim().optional(),
    howHereUs: z.string().trim().optional(),
    revenueRate: z.string().trim().optional(),
    masterShareRate: z.string().trim().optional(),
    accountStatus: z.enum(['lock', 'un-lock', 'terminate']).optional(),
    isBlock: z.boolean().optional(),
    isApproved: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const AdminZodSchema = {
  registerAdminSchema,
  createUserSchema,
  changePasswordSchema,
  updateAdminSchema,
  updateUserProfileSchema,
};
