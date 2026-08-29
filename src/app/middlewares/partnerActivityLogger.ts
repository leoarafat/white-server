import { NextFunction, Request, Response } from 'express';
import { PartnerActivityLog } from '../modules/partnerApi/activity/partnerActivity.model';

// Runs after authenticatePartnerKey, so req.partnerKey is always set here.
// Logs every partner-API call — success, 4xx, 429, everything — because DFS
// admin explicitly wants visibility into test-key traffic too, unlike ANS's
// opacity toward its own staff on test data (§4 Phase 7). Never blocks the
// response: the write happens after `finish`, off the request's own timing.
export const partnerActivityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const ctx = req.partnerKey;
    if (!ctx) return; // no authenticated key context — nothing to attribute this to.

    PartnerActivityLog.create({
      partnerKey: ctx.keyId,
      user: ctx.userId,
      environment: ctx.environment,
      method: req.method,
      path: req.baseUrl + req.path,
      statusCode: res.statusCode,
      latencyMs: Date.now() - start,
      ip: req.ip || '',
    }).catch(() => {});
  });

  next();
};
