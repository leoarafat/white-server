import { Server, Socket } from 'socket.io';
import { Secret } from 'jsonwebtoken';
import config from '../config';
import { jwtHelpers } from '../helpers/jwtHelpers';
import { logger } from '../shared/logger';
import { getCookieNames } from '../helpers/authTokens';

// Minimal `name=value; name2=value2` cookie-header parser — avoids pulling
// in a typed dependency just for this one read. Not for setting cookies.
const parseCookieHeader = (header: string): Record<string, string> => {
  const out: Record<string, string> = {};
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    if (!key) return;
    try {
      out[key] = decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      out[key] = part.slice(idx + 1).trim();
    }
  });
  return out;
};

export let io: Server;

const ADMIN_ROLES = ['admin', 'super-admin'];
const USER_ROLES = ['user', 'sub-user'];

export const userRoom = (userId: string) => `user:${userId}`;
export const adminRoom = (adminId: string) => `admin:${adminId}`;
export const ADMINS_ROOM = 'admins';

interface AuthedSocket extends Socket {
  authUserId?: string;
  authRole?: string;
}

const initializeSocketIO = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket: AuthedSocket, next) => {
    try {
      // The access token now lives in an httpOnly cookie (not readable by
      // client JS — see helpers/authTokens.ts), so the handshake's own
      // `auth.token` / Authorization header are usually empty. Parse the
      // raw cookie header the socket.io-client sends when connected with
      // `withCredentials: true` and try both the user and admin cookie
      // names, same as the HTTP `auth` middleware's collectTokens().
      const rawCookieHeader = socket.handshake.headers.cookie || '';
      const cookies = rawCookieHeader ? parseCookieHeader(rawCookieHeader) : {};
      const userCookie = cookies[getCookieNames('user').access];
      const adminCookie = cookies[getCookieNames('admin').access];

      const candidates = [
        socket.handshake.auth?.token,
        (socket.handshake.headers.authorization || '').replace('Bearer ', ''),
        userCookie,
        adminCookie,
      ].filter(Boolean) as string[];

      if (!candidates.length) {
        return next(new Error('Unauthorized: missing token'));
      }

      let verified: { userId: string; role: string } | null = null;
      for (const candidate of candidates) {
        try {
          verified = jwtHelpers.verifyToken(
            candidate,
            config.jwt.secret as Secret,
          ) as { userId: string; role: string };
          break;
        } catch {
          // Try the next candidate — an expired/invalid one shouldn't block
          // a still-valid cookie from authenticating the connection.
        }
      }

      if (!verified) {
        return next(new Error('Unauthorized: invalid token'));
      }

      socket.authUserId = verified.userId;
      socket.authRole = verified.role;
      next();
    } catch (error) {
      next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    const { authUserId, authRole } = socket;
    logger.info(`Socket connected: ${socket.id} (${authRole}:${authUserId})`);

    if (authUserId && USER_ROLES.includes(authRole || '')) {
      socket.join(userRoom(authUserId));
    } else if (authUserId && ADMIN_ROLES.includes(authRole || '')) {
      socket.join(adminRoom(authUserId));
      socket.join(ADMINS_ROOM);
    }

    // Legacy: still supported for any ad hoc conversation-scoped events.
    socket.on('joinChat', (data: any) => {
      if (data?.conversationId) socket.join(data.conversationId);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitToUser = (userId: string, event: string, payload: any) => {
  if (!io) return;
  io.to(userRoom(String(userId))).emit(event, payload);
};

export const emitToAdmins = (event: string, payload: any) => {
  if (!io) return;
  io.to(ADMINS_ROOM).emit(event, payload);
};

export const emitToAdmin = (adminId: string, event: string, payload: any) => {
  if (!io) return;
  io.to(adminRoom(String(adminId))).emit(event, payload);
};

export default initializeSocketIO;
