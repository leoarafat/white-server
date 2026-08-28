import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import User from '../app/modules/user/user.model';
import { SubUserPermissionKey } from '../enums/subUserPermissions';

export type OwnerContext = {
  // The account whose catalog/data this request should operate on — the
  // sub-user's master account when the caller is a sub-user, otherwise the
  // caller's own id.
  ownerId: string;
  isSubUser: boolean;
  permissions: string[];
  assignedLabels: string[];
  assignedArtists: string[];
  assignedChannels: string[];
};

// Resolves who a request should act as. A master `user` account always acts
// as itself. A `sub-user` account acts on behalf of its linked master
// (`User.user`) but only for the labels/artists/channels the master has
// explicitly assigned, and only via the permissions the master has granted.
// Always reads fresh from the DB (never trusts the JWT) since permissions can
// change between token issuance and this request.
export const resolveOwnerContext = async (
  reqUser: JwtPayload,
): Promise<OwnerContext> => {
  if (reqUser.role !== 'sub-user') {
    return {
      ownerId: String(reqUser.userId),
      isSubUser: false,
      permissions: [],
      assignedLabels: [],
      assignedArtists: [],
      assignedChannels: [],
    };
  }

  const doc = await User.findById(reqUser.userId)
    .select('user permission assignedLabels assignedArtists assignedChannels')
    .lean();

  if (!doc || !doc.user) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'This sub-user account is not linked to a master account',
    );
  }

  return {
    ownerId: String(doc.user),
    isSubUser: true,
    permissions: (doc.permission as string[]) || [],
    assignedLabels: ((doc.assignedLabels as any[]) || []).map(String),
    assignedArtists: ((doc.assignedArtists as any[]) || []).map(String),
    assignedChannels: ((doc.assignedChannels as any[]) || []).map(String),
  };
};

// Route guard: blocks a sub-user request unless the master has granted the
// given permission key. Masters/admins pass through untouched. Attaches the
// resolved OwnerContext to `req.ownerContext` so the controller/service can
// reuse it without a second DB round-trip.
export const requirePermission =
  (key: SubUserPermissionKey) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.role !== 'sub-user') {
        return next();
      }
      const ctx = await resolveOwnerContext(req.user as JwtPayload);
      if (!ctx.permissions.includes(key)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You don't have permission to access this feature. Ask your master account to grant access.",
        );
      }
      req.ownerContext = ctx;
      next();
    } catch (error) {
      next(error);
    }
  };

// Non-gating variant: resolves + attaches OwnerContext without requiring a
// specific permission (used on routes reachable by both masters and
// sub-users where the sub-user's access is scoped by assigned resources
// rather than blocked outright, e.g. reading the label/artist/channel
// dropdown lists used on the upload form).
export const attachOwnerContext = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return next();
    req.ownerContext = await resolveOwnerContext(req.user as JwtPayload);
    next();
  } catch (error) {
    next(error);
  }
};
