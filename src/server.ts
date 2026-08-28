// /* eslint-disable no-undef */
// /* eslint-disable @typescript-eslint/ban-ts-comment */

// import { createServer, Server } from 'http';
// import mongoose from 'mongoose';
// import { app } from './app';
// import config from './config/index';
// import { logger } from './shared/logger';
// import initializeSocketIO from './socket/socket';
// import './utils/tmp-files';

// /* ----------------------------- Config Guardrails ---------------------------- */
// function normalizePort(val: string | number | undefined): number {
//   const port =
//     typeof val === 'string' ? parseInt(val, 10) : Number(val ?? 3000);
//   if (Number.isNaN(port) || port <= 0) throw new Error('Invalid PORT');
//   return port;
// }

// const PORT = normalizePort(config.port);
// const MONGO_URI = String(config.database_url);
// const SHUTDOWN_TIMEOUT_MS = 10_000; // graceful shutdown max wait

// /* --------------------------- HTTP Server & Socket --------------------------- */
// const server: Server = createServer(app);
// initializeSocketIO(server);

// // Keep-Alive/Headers tuning (ঐচ্ছিক)
// server.keepAliveTimeout = 75_000; // ALB/NGINX ইত্যাদির সাথে টিউন করুন
// server.headersTimeout = 79_000;

// /* ----------------------------- Lifecycle Hooks ------------------------------ */
// let isShuttingDown = false;

// async function connectDB(): Promise<void> {
//   await mongoose.connect(MONGO_URI, {
//     // @ts-ignore (necessary options only if you need)
//     serverSelectionTimeoutMS: 12_000,
//     maxPoolSize: 10,
//   });
//   logger.info('✅ MongoDB connected');
// }

// function onServerError(error: NodeJS.ErrnoException) {
//   if (error.syscall !== 'listen') throw error;
//   switch (error.code) {
//     case 'EACCES':
//       logger.error(`Port ${PORT} requires elevated privileges`);
//       process.exit(1);
//       break;
//     case 'EADDRINUSE':
//       logger.error(`Port ${PORT} is already in use`);
//       process.exit(1);
//       break;
//     default:
//       throw error;
//   }
// }

// function startListening(): void {
//   server.listen(PORT, () => {
//     logger.info(`✅ HTTP server listening on port ${PORT}`);
//   });
//   server.on('error', onServerError);
// }

// /* --------------------------------- Startup --------------------------------- */
// async function start(): Promise<void> {
//   try {
//     await connectDB();
//     startListening();
//   } catch (err) {
//     logger.error('Startup failed:', err);
//     process.exit(1);
//   }
// }

// void start();

// /* -------------------------- Health/Readiness Probes ------------------------- */
// // চাইলে app-এও রাখতে পারেন—এখানে সরাসরি সার্ভারের ওপর:
// app.get('/healthz', (_req, res) => {
//   res
//     .status(200)
//     .json({ ok: true, pid: process.pid, shuttingDown: isShuttingDown });
// });

// app.get('/readyz', (_req, res) => {
//   const mongoReady = mongoose.connection.readyState === 1; // 1 = connected
//   if (isShuttingDown || !mongoReady)
//     return res.status(503).json({ ready: false });
//   res.status(200).json({ ready: true });
// });

// /* --------------------- Fatal & Non-fatal Error Handlers --------------------- */
// // uncaughtException → immediate crash (state unknown)
// process.on('uncaughtException', err => {
//   logger.error('Uncaught Exception:', err);
//   // flush logs if needed, then exit
//   process.exit(1);
// });

// // unhandledRejection → try graceful shutdown (app state might be ok)
// process.on('unhandledRejection', err => {
//   logger.error('Unhandled Rejection:', err);
//   initiateShutdown('unhandledRejection');
// });

// /* ----------------------------- Graceful Shutdown ---------------------------- */
// function initiateShutdown(reason: string) {
//   if (isShuttingDown) return;
//   isShuttingDown = true;
//   logger.warn(`👍 Initiating graceful shutdown (${reason}) ...`);

//   // Stop taking new connections
//   server.close(async () => {
//     try {
//       await mongoose.connection.close();
//       logger.info('✅ MongoDB connection closed');
//     } catch (e) {
//       logger.warn('Mongo close failed:', e);
//     } finally {
//       logger.info('👋 Process exit after graceful shutdown');
//       process.exit(0);
//     }
//   });

//   // Hard timeout fallback
//   setTimeout(() => {
//     logger.error('⏱️ Shutdown timed out, forcing exit');
//     process.exit(1);
//   }, SHUTDOWN_TIMEOUT_MS).unref();
// }

// // OS signals
// process.on('SIGINT', () => initiateShutdown('SIGINT'));
// process.on('SIGTERM', () => initiateShutdown('SIGTERM'));
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { createServer, Server } from 'http';
import mongoose from 'mongoose';
import { app } from './app';
import config from './config/index';
import { logger } from './shared/logger';
import initializeSocketIO from './socket/socket';
import './utils/tmp-files';

/* ----------------------------- Config Guardrails ---------------------------- */
function normalizePort(val: string | number | undefined): number {
  const port =
    typeof val === 'string' ? parseInt(val, 10) : Number(val ?? 3000);
  if (Number.isNaN(port) || port <= 0) throw new Error('Invalid PORT');
  return port;
}

const PORT = normalizePort(config.port);
const MONGO_URI = String(config.database_url);
const SHUTDOWN_TIMEOUT_MS = 10_000;

/* --------------------------- HTTP Server & Socket --------------------------- */
const server: Server = createServer(app);
initializeSocketIO(server);

// ─── Timeout Configuration ────────────────────────────────────────────────────
//
// These MUST be set BEFORE server.listen() is called.
//
// Why these values:
//   Nginx proxy_read_timeout = 600s  (what we set in nginx config)
//   Node server.timeout      = 660s  ← must be HIGHER than Nginx's 600s
//   Node keepAliveTimeout    = 120s  ← must be HIGHER than Nginx keepalive_timeout (75s default)
//   Node headersTimeout      = 125s  ← must be slightly HIGHER than keepAliveTimeout
//
// If Node's timeout fires BEFORE Nginx's, Nginx gets a connection reset
// and returns 502 Bad Gateway instead of waiting for the upload to finish.
// Setting Node higher than Nginx means Nginx always times out first (giving
// a clean 504/408), but in practice with the fix both should never fire.

server.timeout = 660_000; // 11 min — node socket timeout (covers upload + S3 confirm + DB write)
server.keepAliveTimeout = 120_000; // 2 min  — must be > nginx keepalive_timeout (75s)
server.headersTimeout = 125_000; // 2 min 5s — must be > keepAliveTimeout

/* ----------------------------- Lifecycle Hooks ------------------------------ */
let isShuttingDown = false;

async function connectDB(): Promise<void> {
  await mongoose.connect(MONGO_URI, {
    // @ts-ignore
    serverSelectionTimeoutMS: 12_000,
    maxPoolSize: 10,
  });
  logger.info('✅ MongoDB connected');
}

function onServerError(error: NodeJS.ErrnoException) {
  if (error.syscall !== 'listen') throw error;
  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function startListening(): void {
  server.listen(PORT, () => {
    logger.info(`✅ HTTP server listening on port ${PORT}`);
    logger.info(`✅ server.timeout       = ${server.timeout / 1000}s`);
    logger.info(`✅ server.keepAlive     = ${server.keepAliveTimeout / 1000}s`);
    logger.info(`✅ server.headersTimeout= ${server.headersTimeout / 1000}s`);
  });
  server.on('error', onServerError);
}

/* --------------------------------- Startup --------------------------------- */
async function start(): Promise<void> {
  try {
    await connectDB();
    startListening();
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}

void start();

/* -------------------------- Health/Readiness Probes ------------------------- */
app.get('/healthz', (_req, res) => {
  res
    .status(200)
    .json({ ok: true, pid: process.pid, shuttingDown: isShuttingDown });
});

app.get('/readyz', (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  if (isShuttingDown || !mongoReady)
    return res.status(503).json({ ready: false });
  res.status(200).json({ ready: true });
});

/* --------------------- Fatal & Non-fatal Error Handlers --------------------- */
process.on('uncaughtException', err => {
  logger.error('Uncaught Exception (server kept alive):', err);
});

process.on('unhandledRejection', err => {
  logger.error('Unhandled Rejection (server kept alive):', err);
});

/* ----------------------------- Graceful Shutdown ---------------------------- */
function initiateShutdown(reason: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.warn(`👍 Initiating graceful shutdown (${reason}) ...`);

  server.close(async () => {
    try {
      await mongoose.connection.close();
      logger.info('✅ MongoDB connection closed');
    } catch (e) {
      logger.warn('Mongo close failed:', e);
    } finally {
      logger.info('👋 Process exit after graceful shutdown');
      process.exit(0);
    }
  });

  setTimeout(() => {
    logger.error('⏱️ Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGINT', () => initiateShutdown('SIGINT'));
process.on('SIGTERM', () => initiateShutdown('SIGTERM'));
