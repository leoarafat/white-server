/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import User from '../modules/user/user.model';
import Admin from '../modules/admin/admin.model';
import { getCookieNames } from '../../helpers/authTokens';

// Collect every access-token candidate available on the request. In production
// each app lives on its own domain and only sends its own cookie, but in dev
// admin + user share `localhost`, so both cookies can be present at once — we
// verify each and let the role guard below pick the right one.
const collectTokens = (req: Request): string[] => {
  const tokens: string[] = [];
  const userCookie = req.cookies?.[getCookieNames('user').access];
  const adminCookie = req.cookies?.[getCookieNames('admin').access];
  if (userCookie) tokens.push(userCookie);
  if (adminCookie) tokens.push(adminCookie);

  // Backwards/interop support: still accept a Bearer header if provided.
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith('Bearer ')) {
    tokens.push(bearer.split(' ')[1]);
  }
  return tokens;
};

const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = collectTokens(req);
      if (!tokens.length) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized');
      }

      const verified: JwtPayload[] = [];
      for (const token of tokens) {
        try {
          verified.push(
            jwtHelpers.verifyToken(token, config.jwt.secret as Secret),
          );
        } catch {
          // Ignore individual invalid/expired tokens; another candidate may work.
        }
      }

      if (!verified.length) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
      }

      // Disambiguate when both a user and an admin cookie are present (same
      // browser in dev, or the impersonation handoff). The calling app tells us
      // which identity it wants via X-Auth-Scope.
      const scope = req.headers['x-auth-scope'];
      const roleMatchesScope = (role?: string) => {
        if (scope === 'admin') return role === 'admin' || role === 'super-admin';
        if (scope === 'user') return role === 'user' || role === 'sub-user';
        return true;
      };

      let verifyUser: JwtPayload | undefined;
      // 1) A token satisfying both the route guard AND the app scope.
      verifyUser = verified.find(
        v =>
          (!roles.length || roles.includes(v.role as string)) &&
          roleMatchesScope(v.role as string),
      );
      // 2) Any token satisfying the route guard.
      if (!verifyUser && roles.length) {
        verifyUser = verified.find(v => roles.includes(v.role as string));
      }
      // 3) Any token matching the app scope.
      if (!verifyUser) {
        verifyUser = verified.find(v => roleMatchesScope(v.role as string));
      }
      if (!verifyUser) verifyUser = verified[0];

      req.user = verifyUser;

      if (verifyUser.role === 'user' || verifyUser.role === 'sub-user') {
        const isExist = await User.findById(verifyUser?.userId);
        if (!isExist) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
        }
      } else if (
        verifyUser.role === 'admin' ||
        verifyUser.role === 'super-admin'
      ) {
        const checkAdmin = await Admin.findById(verifyUser?.userId);
        if (!checkAdmin) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Admin not found');
        }
      }

      if (roles.length && !roles.includes(verifyUser.role as string)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'Access Forbidden: You lack permission for this route',
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
