import crypto from 'crypto';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';

// Reversible encryption for the Revelator login password — every other
// crypto use in this codebase (bcrypt, sha256 hashes) is one-way, but the
// upload worker needs the plaintext back to type it into Revelator's login
// form. AES-256-GCM keyed off SETTINGS_ENCRYPTION_KEY (32-byte hex, generate
// with `openssl rand -hex 32`).
const ALGO = 'aes-256-gcm';

const getKey = (): Buffer => {
  const hex = config.settings.encryptionKey;
  if (!hex) {
    throw new ApiError(500, 'SETTINGS_ENCRYPTION_KEY is not configured');
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new ApiError(
      500,
      'SETTINGS_ENCRYPTION_KEY must be a 32-byte hex string (openssl rand -hex 32)',
    );
  }
  return key;
};

// Stored shape: "<iv-hex>:<authTag-hex>:<ciphertext-hex>"
export const encryptSecret = (plainText: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptSecret = (stored: string): string => {
  const [ivHex, authTagHex, dataHex] = stored.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new ApiError(500, 'Malformed encrypted secret');
  }
  const decipher = crypto.createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};
