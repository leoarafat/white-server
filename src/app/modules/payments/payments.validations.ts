import { z } from 'zod';
import { objectId, requiredString } from '../../../shared/zodCommon';

// month/year/user/approvedStatus are all set server-side.
const requestForPaymentSchema = z.object({
  body: z.object({
    bankId: objectId('bankId'),
    accountNumber: requiredString('accountNumber'),
    providerName: requiredString('providerName'),
    currentMonthBalance: requiredString('currentMonthBalance'),
  }),
});

const adminBalanceAdjustSchema = z.object({
  body: z.object({
    userId: objectId('userId'),
    amount: z.coerce.number().positive('amount must be greater than 0'),
  }),
});

const rejectPaymentSchema = z.object({
  body: z.object({
    paymentId: objectId('paymentId'),
  }),
});

const makePaymentSchema = z.object({
  body: z.object({
    user: objectId('user'),
    paymentRequest: objectId('paymentRequest'),
    amount: z.coerce.number().positive('amount must be greater than 0'),
    method: z.enum(['bank', 'bkash', 'cash', 'check', 'web-service'], {
      required_error: 'method is required',
    }),
    transactionType: z.enum(['payment', 'withdrawal']).optional(),
    transactionId: z.string().trim().optional(),
    externalId: z.string().trim().optional(),
    vendorId: z.string().trim().optional(),
    associatedContact: z.string().trim().optional(),
    memo: z.string().trim().optional(),
  }),
});

export const PaymentZodSchema = {
  requestForPaymentSchema,
  adminBalanceAdjustSchema,
  rejectPaymentSchema,
  makePaymentSchema,
};
