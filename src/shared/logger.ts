import { createLogger, format, transports } from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, label, printf, prettyPrint } = format;

// Custom log
const myFormat = printf(({ level, message, label, timestamp }) => {
  const date = new Date(timestamp);
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  return `${date.toDateString()} ${h}:${m} ${s} [${label}] ${level}: ${message}`;
});

const logDir = path.join(process.cwd(), 'logs', 'winston');

export const logger = createLogger({
  level: 'info',
  format: combine(label({ label: 'AP' }), timestamp(), myFormat, prettyPrint()),
  transports: [
    new transports.Console(),
    new transports.File({
      level: 'info',
      filename: path.join(logDir, 'successes', 'um-success.log'),
    }),
    new DailyRotateFile({
      level: 'info',
      filename: path.join(logDir, 'successes', 'um-%DATE%-success.log'),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export const errorLogger = createLogger({
  level: 'error',
  format: combine(label({ label: 'AP' }), timestamp(), myFormat),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'errors', 'um-%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});
// import { createLogger, format, transports } from 'winston';
// import path from 'path';
// import DailyRotateFile from 'winston-daily-rotate-file';
// import fs from 'fs';

// const { combine, timestamp, label, printf } = format;

// // ✅ Ensure log directories exist
// const logDir = path.join(process.cwd(), 'logs', 'winston');
// const successDir = path.join(logDir, 'successes');
// const errorDir = path.join(logDir, 'errors');

// [logDir, successDir, errorDir].forEach(dir => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// });

// // ✅ Clean format
// const myFormat = printf(({ level, message, label, timestamp }) => {
//   const date = new Date(timestamp as string);
//   const h = date.getHours();
//   const m = date.getMinutes();
//   const s = date.getSeconds();
//   return `${date.toDateString()} ${h}:${m}:${s} [${label}] ${level}: ${message}`;
// });

// // ✅ Shared rotate options
// const rotateOptions = {
//   datePattern: 'YYYY-MM-DD', // Daily rotation (not hourly)
//   zippedArchive: true, // Compress old logs
//   maxSize: '20m', // Max 20MB per file
//   maxFiles: '7d', // Keep only 7 days — DELETE older automatically
//   auditFile: path.join(logDir, '.audit.json'),
// };

// // ✅ Success / Info Logger
// export const logger = createLogger({
//   level: 'info',
//   format: combine(label({ label: 'AP' }), timestamp(), myFormat),
//   transports: [
//     new transports.Console(),

//     // ❌ REMOVED: transports.File() — was writing unlimited to um-success.log

//     // ✅ Daily rotate only — auto deletes after 7 days
//     new DailyRotateFile({
//       ...rotateOptions,
//       level: 'info',
//       filename: path.join(successDir, 'um-%DATE%-success.log'),
//       auditFile: path.join(logDir, '.audit-success.json'),
//     }),
//   ],
// });

// // ✅ Error Logger
// export const errorLogger = createLogger({
//   level: 'error',
//   format: combine(label({ label: 'AP' }), timestamp(), myFormat),
//   transports: [
//     new transports.Console(),

//     // ✅ Daily rotate — auto deletes after 7 days
//     new DailyRotateFile({
//       ...rotateOptions,
//       level: 'error',
//       filename: path.join(errorDir, 'um-%DATE%-error.log'),
//       auditFile: path.join(logDir, '.audit-error.json'),
//     }),
//   ],
// });

// // ✅ Handle rotation events for monitoring
// logger.on('error', err => {
//   console.error('Logger error:', err);
// });
