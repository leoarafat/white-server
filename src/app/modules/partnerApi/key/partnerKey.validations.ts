import { z } from 'zod';
import { objectId, requiredString } from '../../../../shared/zodCommon';
import { PARTNER_SCOPES } from '../partnerApi.constants';

const createKeySchema = z.object({
  body: z.object({
    userId: objectId('userId'),
    label: requiredString('label'),
    environment: z.enum(['live', 'test'], {
      required_error: 'environment is required',
    }),
    scopes: z
      .array(z.enum(PARTNER_SCOPES))
      .nonempty('At least one scope is required'),
    ipAllowlist: z.array(z.string().trim()).optional(),
  }),
});

export const PartnerKeyZodSchema = {
  createKeySchema,
};
