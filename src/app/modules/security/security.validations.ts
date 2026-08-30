import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const subjectTypeSchema = z.enum(['admin', 'user']).optional();

const verifyEnable2FASchema = z.object({
  body: z.object({
    code: requiredString('code'),
  }),
});

const disable2FASchema = z.object({
  body: z.object({
    password: requiredString('password'),
    code: requiredString('code'),
  }),
});

const loginVerify2FASchema = z.object({
  body: z.object({
    tempToken: requiredString('tempToken'),
    code: requiredString('code'),
  }),
});

// WebAuthn's PublicKeyCredential JSON response has a large, browser-defined
// shape — checked here only for "is an object", the WebAuthn library itself
// verifies its contents.
const passkeyRegisterVerifySchema = z.object({
  body: z.object({
    challengeToken: requiredString('challengeToken'),
    response: z.record(z.any(), { required_error: 'response is required' }),
  }),
});

const passkeyLoginOptionsSchema = z.object({
  body: z.object({
    subjectType: subjectTypeSchema,
    email: z.string().trim().email('A valid email is required').optional(),
  }),
});

const passkeyLoginVerifySchema = z.object({
  body: z.object({
    subjectType: subjectTypeSchema,
    challengeToken: requiredString('challengeToken'),
    response: z.record(z.any(), { required_error: 'response is required' }),
  }),
});

export const SecurityZodSchema = {
  verifyEnable2FASchema,
  disable2FASchema,
  loginVerify2FASchema,
  passkeyRegisterVerifySchema,
  passkeyLoginOptionsSchema,
  passkeyLoginVerifySchema,
};
