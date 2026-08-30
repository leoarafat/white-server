import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const addBankAccountSchema = z.object({
  body: z.object({
    bankName: requiredString('Bank Name'),
    accountName: requiredString('Account Name'),
    accountNumber: requiredString('Account Number'),
    branchName: z.string().trim().optional(),
    phoneNumber: z.string().trim().optional(),
  }),
});

const addMobileBankAccountSchema = z.object({
  body: z.object({
    accountName: requiredString('Account Name'),
    accountNumber: requiredString('Account Number'),
    providerName: requiredString('Provider Name'),
  }),
});

const addPioneerAccountSchema = z.object({
  body: z.object({
    accountNumber: requiredString('Account Number'),
    email: requiredString('Email').email('A valid email is required'),
  }),
});

// The admin edit endpoint patches whichever of the three account types
// owns the given id, so every field across all three shapes is optional here.
const updateAccountSchema = z.object({
  body: z.object({
    bankName: z.string().trim().min(1).optional(),
    branchName: z.string().trim().optional(),
    providerName: z.string().trim().min(1).optional(),
    accountName: z.string().trim().min(1).optional(),
    accountNumber: z.string().trim().min(1).optional(),
    phoneNumber: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
  }),
});

export const AccountZodSchema = {
  addBankAccountSchema,
  addMobileBankAccountSchema,
  addPioneerAccountSchema,
  updateAccountSchema,
};
