import crypto from 'crypto';

// Signature algorithm — documented for partners in Phase 9, must never
// silently drift from what's actually implemented here:
//   v1=HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
export const signWebhookPayload = (secret: string, timestamp: string, rawBody: string): string =>
  'v1=' + crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
