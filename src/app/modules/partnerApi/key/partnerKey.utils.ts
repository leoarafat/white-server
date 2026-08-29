import crypto from 'crypto';
import { PARTNER_KEY_PREFIX, PartnerEnvironment } from '../partnerApi.constants';

// Plaintext shape: pk_live_<48 hex chars>. Only ever exists in memory / the
// one creation response — never persisted.
export const generatePartnerKey = (
  environment: PartnerEnvironment,
): { plaintext: string; hash: string; prefix: string } => {
  const secret = crypto.randomBytes(24).toString('hex');
  const plaintext = `${PARTNER_KEY_PREFIX}_${environment}_${secret}`;
  const hash = hashPartnerKey(plaintext);
  // Shown in admin list views, e.g. "pk_live_4f2c…" — enough to recognize
  // a key, never enough to reconstruct or use it.
  const prefix = plaintext.slice(0, PARTNER_KEY_PREFIX.length + 1 + environment.length + 5);
  return { plaintext, hash, prefix };
};

export const hashPartnerKey = (plaintext: string): string =>
  crypto.createHash('sha256').update(plaintext).digest('hex');
