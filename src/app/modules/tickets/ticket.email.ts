import { logger } from '../../../shared/logger';

// Email seam for tickets. The user asked to defer inbound/outbound email
// until the core system is proven, so this is a deliberate no-op gated behind
// TICKET_EMAIL_ENABLED. When email is built later, implement send + inbound
// webhook parsing here; every call site already routes through this function.
const EMAIL_ENABLED = process.env.TICKET_EMAIL_ENABLED === 'true';

export const notifyByEmailIfEnabled = async (params: {
  to?: string;
  subject: string;
  body: string;
}) => {
  if (!EMAIL_ENABLED) return;
  // Intentionally unimplemented — deferred feature.
  logger.info(`[ticket-email:disabled] would send to ${params.to}`);
};
