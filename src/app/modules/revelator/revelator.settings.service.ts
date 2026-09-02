import {
  RevelatorSettings,
  REVELATOR_SETTINGS_SINGLETON_ID,
} from './revelator.settings.model';
import { encryptSecret, decryptSecret } from './revelator.crypto';
import ApiError from '../../../errors/ApiError';

const getSettings = async () => {
  const doc = await RevelatorSettings.findById(
    REVELATOR_SETTINGS_SINGLETON_ID,
  ).lean();
  if (!doc) {
    return { username: null, hasPassword: false, updatedAt: null };
  }
  return {
    username: doc.username,
    hasPassword: Boolean(doc.passwordEncrypted),
    updatedAt: doc.updatedAt,
  };
};

const saveSettings = async (
  username: string,
  password: string,
  adminId: string,
) => {
  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }
  const passwordEncrypted = encryptSecret(password);
  await RevelatorSettings.findByIdAndUpdate(
    REVELATOR_SETTINGS_SINGLETON_ID,
    {
      username,
      passwordEncrypted,
      updatedBy: adminId,
      updatedAt: new Date(),
    },
    { upsert: true },
  );
  return getSettings();
};

// Used only by the puppeteer bot (server-side, never returned to a client).
export const getDecryptedCredentials = async (): Promise<{
  username: string;
  password: string;
} | null> => {
  const doc = await RevelatorSettings.findById(
    REVELATOR_SETTINGS_SINGLETON_ID,
  ).lean();
  if (!doc) return null;
  return {
    username: doc.username,
    password: decryptSecret(doc.passwordEncrypted),
  };
};

export const RevelatorSettingsService = { getSettings, saveSettings };
