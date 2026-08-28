/**
 * Fields a client must NEVER be able to set directly through a create/edit
 * payload. They are managed exclusively by dedicated server-side flows:
 *
 *  - isVevo / vevoTransfer*  → set only by the VEVO transfer endpoint
 *  - isApproved              → set only by distribute / manual-approve flows
 *  - videoStatus             → set only by take-down / distribute flows
 *  - isCorrection            → set only by the correction flow
 *  - user / _id / videoId    → identity fields, set by the server on create
 *
 * Spreading raw request bodies into Mongo updates previously allowed a
 * client payload (e.g. a form that echoed a whole video object back) to
 * flip isVevo to true without the video ever being transferred to VEVO.
 */
export const PROTECTED_VIDEO_FIELDS = [
  '_id',
  'user',
  'videoId',
  'isVevo',
  'vevoTransferStatus',
  'vevoTransferError',
  'vevoTransferStartedAt',
  'vevoTransferredAt',
  'isApproved',
  'videoStatus',
  'isCorrection',
  'createdAt',
  'updatedAt',
] as const;

/**
 * Returns a copy of the payload with all protected fields removed.
 * Use this on EVERY client-supplied video payload before writing to Mongo.
 */
export const stripProtectedVideoFields = <T extends Record<string, unknown>>(
  payload: T,
): Partial<T> => {
  const sanitized: Record<string, unknown> = { ...payload };
  for (const field of PROTECTED_VIDEO_FIELDS) {
    delete sanitized[field];
  }
  return sanitized as Partial<T>;
};
