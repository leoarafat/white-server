import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      partnerQuery?: any;
    }
  }
}

type Schema = AnyZodObject | ZodEffects<any>;

// Lightweight body/query validator for the partner API — the existing
// validateRequest wraps req.body in a {body, data, title, ...} envelope that
// doesn't fit a plain external JSON contract. Zod throws on anything that
// isn't the declared type, which is what keeps a Mongo-operator-shaped value
// (e.g. `{"$ne": null}`) from ever reaching a query — see §6 checklist.
export const validatePartnerBody =
  (schema: Schema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

export const validatePartnerQuery =
  (schema: Schema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      (req as any).partnerQuery = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
