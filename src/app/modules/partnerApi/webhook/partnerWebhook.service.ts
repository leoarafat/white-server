import crypto from 'crypto';
import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiError';
import { PartnerWebhook } from './partnerWebhook.model';
import { signWebhookPayload } from './partnerWebhook.crypto';
import { PartnerAuthContext } from '../../../middlewares/partnerAuth';
import { PartnerEnvironment } from '../partnerApi.constants';

const PREVIOUS_SECRET_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h rotation grace window
const DELIVERY_TIMEOUT_MS = 8000;
// Total spread ~1 minute across 4 attempts, per §2.7/§5.
const RETRY_DELAYS_MS = [0, 5000, 15000, 30000];

const generateSecret = () => 'whsec_' + crypto.randomBytes(32).toString('hex');

export const setWebhook = async (
  ctx: PartnerAuthContext,
  input: { url: string; rotateSecret?: boolean },
) => {
  const existing = await PartnerWebhook.findOne({
    user: ctx.userId,
    environment: ctx.environment,
  }).select('+secret +previousSecret');

  if (!existing) {
    const secret = generateSecret();
    await PartnerWebhook.create({
      user: ctx.userId,
      environment: ctx.environment,
      url: input.url,
      secret,
    });
    return {
      url: input.url,
      secret,
      secretRotated: true,
      note:
        'Store this secret now — it is not shown again, and it is NOT your API key. Verify each delivery with HMAC-SHA256 over "<x-arp-timestamp>.<body>" and compare to x-arp-signature.',
    };
  }

  existing.url = input.url;

  if (input.rotateSecret) {
    const newSecret = generateSecret();
    existing.previousSecret = existing.secret;
    existing.previousSecretExpiresAt = new Date(Date.now() + PREVIOUS_SECRET_WINDOW_MS);
    existing.secret = newSecret;
    await existing.save();
    return {
      url: existing.url,
      secret: newSecret,
      secretRotated: true,
      note:
        'Store this secret now — it is not shown again, and it is NOT your API key. The previous secret keeps working for 24h so in-flight integrations do not break.',
    };
  }

  await existing.save();
  return { url: existing.url, secretRotated: false };
};

export const getWebhookStatus = async (ctx: PartnerAuthContext) => {
  const webhook = await PartnerWebhook.findOne({ user: ctx.userId, environment: ctx.environment });
  if (!webhook) return null;
  return { url: webhook.url, createdAt: webhook.createdAt, updatedAt: webhook.updatedAt };
};

export const getWebhookUrlForMe = async (userId: string, environment: PartnerEnvironment) => {
  const webhook = await PartnerWebhook.findOne({ user: userId, environment });
  return webhook?.url || null;
};

type DeliveryResult = {
  delivered: boolean;
  responseStatus: number | null;
  error: string | null;
};

const attemptDelivery = async (
  url: string,
  secret: string,
  rawBody: string,
  timestamp: string,
): Promise<DeliveryResult> => {
  const signature = signWebhookPayload(secret, timestamp, rawBody);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-arp-timestamp': timestamp,
        'x-arp-signature': signature,
      },
      body: rawBody,
      signal: controller.signal,
    });

    if (res.ok) {
      return { delivered: true, responseStatus: res.status, error: null };
    }
    return {
      delivered: false,
      responseStatus: res.status,
      error: `Your endpoint answered ${res.status}.`,
    };
  } catch (err: any) {
    return { delivered: false, responseStatus: null, error: err?.message || 'Request failed' };
  } finally {
    clearTimeout(timeout);
  }
};

// Single immediate attempt with a precise diagnostic — this is what makes
// the webhook wiring self-verifiable before any real event ever fires.
export const testWebhook = async (ctx: PartnerAuthContext) => {
  const webhook = await PartnerWebhook.findOne({
    user: ctx.userId,
    environment: ctx.environment,
  }).select('+secret');

  if (!webhook) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No webhook is registered for this environment yet');
  }

  const envelope = {
    event: 'webhook.test',
    environment: ctx.environment,
    sentAt: new Date().toISOString(),
    data: { message: 'If you can read this and the signature checked out, you are done.' },
  };
  const rawBody = JSON.stringify(envelope);
  const timestamp = String(Math.floor(Date.now() / 1000));

  const result = await attemptDelivery(webhook.url, webhook.secret, rawBody, timestamp);

  return {
    url: webhook.url,
    delivered: result.delivered,
    responseStatus: result.responseStatus,
    error: result.error,
    sentBody: envelope,
  };
};

// Fire-and-log real (or simulated) event delivery — retried per §5. Never
// throws: a partner's broken receiver must not fail the caller's own API
// request that triggered this event.
export const dispatchWebhookEvent = async (
  userId: string,
  environment: PartnerEnvironment,
  event: string,
  data: unknown,
) => {
  const webhook = await PartnerWebhook.findOne({ user: userId, environment }).select('+secret');
  if (!webhook) return; // nothing registered — nothing to deliver.

  const envelope = { event, environment, sentAt: new Date().toISOString(), data };
  const rawBody = JSON.stringify(envelope);
  const timestamp = String(Math.floor(Date.now() / 1000));

  for (const delayMs of RETRY_DELAYS_MS) {
    if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs));
    const result = await attemptDelivery(webhook.url, webhook.secret, rawBody, timestamp);
    if (result.delivered) return;
  }
};
