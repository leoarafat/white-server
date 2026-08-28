import { JwtPayload } from 'jsonwebtoken';
import { OwnerContext } from '../shared/subUserAccess';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      user: JwtPayload | null;
      company?: string;
      permissions?: string[];
      ownerContext?: OwnerContext;
    }
  }
}
