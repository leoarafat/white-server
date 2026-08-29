// Environment prefix is deployment-configurable since dashboard-for-sale is
// white-labeled per client business — never hardcode a DFS-specific prefix.
export const PARTNER_KEY_PREFIX = process.env.PARTNER_KEY_PREFIX || 'pk';

export const PARTNER_SCOPES = [
  'release:write',
  'release:read',
  'upload:write',
  'channel:write',
  'channel:read',
  'webhook:manage',
] as const;

export type PartnerScope = (typeof PARTNER_SCOPES)[number];

export type PartnerEnvironment = 'live' | 'test';

// Requests per key, per minute — §2.9 of the partner API plan.
export const PARTNER_RATE_LIMITS = {
  releaseCreate: 120,
  releaseList: 300,
  releaseRead: 600,
  uploadStart: 120,
  uploadSignParts: 600,
  channelCreate: 30,
  channelList: 120,
  webhookRead: 60,
  webhookSet: 20,
  simulate: 60,
} as const;

export type PartnerRateLimitCategory = keyof typeof PARTNER_RATE_LIMITS;
