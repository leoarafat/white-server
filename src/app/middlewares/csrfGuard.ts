import { NextFunction, Request, Response } from 'express';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const AUTH_COOKIE_NAMES = [
  'an_at',
  'an_rt',
  'an_admin_at',
  'an_admin_rt',
  'refreshToken',
];
// Value both SPAs attach to every request.
const REQUIRED_HEADER = 'x-requested-with';

// Defense-in-depth against CSRF: our cookies are SameSite=None (sent cross-site),
// so a forged form POST could ride a victim's cookie. Forms cannot set custom
// headers, and any fetch/XHR that does is forced through a CORS preflight that
// our strict origin allow-list blocks. We only enforce the header when an auth
// cookie is actually present, which transparently exempts server-to-server
// callbacks (no cookies) and the very first login (no cookie yet).
const csrfGuard = (req: Request, _res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const hasAuthCookie = AUTH_COOKIE_NAMES.some(name =>
    Boolean(req.cookies?.[name]),
  );
  if (!hasAuthCookie) return next();

  if (!req.headers[REQUIRED_HEADER]) {
    return next(
      new ApiError(httpStatus.FORBIDDEN, 'Missing anti-CSRF request header'),
    );
  }
  return next();
};

export default csrfGuard;
