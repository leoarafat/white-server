import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiError';
import User from '../../user/user.model';
import { PartnerKey } from './partnerKey.model';
import { generatePartnerKey } from './partnerKey.utils';
import { PARTNER_SCOPES, PartnerEnvironment, PartnerScope } from '../partnerApi.constants';
import { getWebhookUrlForMe } from '../webhook/partnerWebhook.service';

type CreateKeyInput = {
  userId: string;
  label: string;
  environment: PartnerEnvironment;
  scopes: PartnerScope[];
  ipAllowlist?: string[];
};

export const createPartnerKey = async (input: CreateKeyInput) => {
  const user = await User.findById(input.userId);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (!input.label?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A label is required for this key');
  }

  if (!['live', 'test'].includes(input.environment)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'environment must be "live" or "test"');
  }

  const invalidScope = input.scopes.find(s => !PARTNER_SCOPES.includes(s));
  if (invalidScope) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Unknown scope: ${invalidScope}`);
  }

  if (input.scopes.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one scope is required');
  }

  // Webhook management is kept on its own, single-purpose key — never bundled
  // with release/upload/channel scopes. This is the same least-privilege
  // pattern the reference integration confirmed a real provider uses for
  // exactly this credential, made mandatory here rather than left as an
  // admin convention.
  if (input.scopes.includes('webhook:manage') && input.scopes.length > 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'webhook:manage must be issued on its own key, not combined with other scopes',
    );
  }

  const { plaintext, hash, prefix } = generatePartnerKey(input.environment);

  const created = await PartnerKey.create({
    user: input.userId,
    label: input.label.trim(),
    environment: input.environment,
    scopes: input.scopes,
    keyHash: hash,
    keyPrefix: prefix,
    ipAllowlist: input.ipAllowlist || [],
  });

  // The only point in this key's lifetime the plaintext is ever available.
  return {
    id: created._id,
    label: created.label,
    environment: created.environment,
    scopes: created.scopes,
    keyPrefix: created.keyPrefix,
    key: plaintext,
    note: 'Store this key now — it will not be shown again.',
  };
};

export const listPartnerKeys = async (userId?: string) => {
  const filter = userId ? { user: userId } : {};
  const keys = await PartnerKey.find(filter).sort({ createdAt: -1 }).lean();
  return keys.map(k => ({
    id: k._id,
    user: k.user,
    label: k.label,
    environment: k.environment,
    scopes: k.scopes,
    keyPrefix: k.keyPrefix,
    ipAllowlist: k.ipAllowlist,
    revokedAt: k.revokedAt,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
  }));
};

export const revokePartnerKey = async (id: string) => {
  const key = await PartnerKey.findById(id);
  if (!key) {
    throw new ApiError(httpStatus.NOT_FOUND, 'API key not found');
  }
  if (!key.revokedAt) {
    key.revokedAt = new Date();
    await key.save();
  }
  return { id: key._id, revokedAt: key.revokedAt };
};

export const getPartnerMe = async (userId: string, environment: PartnerEnvironment, scopes: PartnerScope[]) => {
  const user = await User.findById(userId).select('channelName name email').lean();
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Linked account no longer exists');
  }

  return {
    company: (user as any).channelName || (user as any).name,
    environment,
    scopes,
    linkedAccount: { id: user._id, name: (user as any).channelName || (user as any).name },
    webhookUrl: await getWebhookUrlForMe(userId, environment),
  };
};
