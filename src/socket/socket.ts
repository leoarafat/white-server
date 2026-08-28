import { Server, Socket } from 'socket.io';
import { Secret } from 'jsonwebtoken';
import config from '../config';
import { jwtHelpers } from '../helpers/jwtHelpers';
import { logger } from '../shared/logger';

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
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace(
          'Bearer ',
          '',
        );

      if (!token) {
        return next(new Error('Unauthorized: missing token'));
      }

      const verified = jwtHelpers.verifyToken(
        token,
        config.jwt.secret as Secret,
      );

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
