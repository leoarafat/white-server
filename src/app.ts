import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import routes from './app/routes';
import { NotFoundHandler } from './errors/NotFoundHandler';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { cleanupOrphanedVevoTempFiles } from './app/modules/catalog-video/vevo-s3';
import { SmartLinkPublicRoutes } from './app/modules/smart-link/smart-link.public.routes';
import config from './config';
import csrfGuard from './app/middlewares/csrfGuard';
// import '../src/app/modules/user-balance/balanceSync.cron';

export const app: Application = express();

// Explicit credentialed-CORS allow-list. Cookie-based auth requires a fixed
// origin set (not `origin: true`, which reflects any caller). Production origins
// come entirely from env (CLIENT_URL / ADMIN_URL / EXTRA_CORS_ORIGINS); the
// localhost dev origins are only added when NODE_ENV !== production.
const devOrigins =
  config.env === 'production'
    ? []
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ];

const allowedOrigins = new Set(
  [
    config.client_url,
    config.admin_url,
    config.base_url,
    ...(config.extra_cors_origins
      ? config.extra_cors_origins.split(',').map(o => o.trim())
      : []),
    ...devOrigins,
  ]
    .filter(Boolean)
    .map(o => (o as string).replace(/\/$/, '')),
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools / same-origin requests (no Origin header) and
      // server-to-server callbacks.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// });
// app.use(limiter);
app.use(express.json({ limit: '6000mb' }));
app.use(express.urlencoded({ extended: true, limit: '5000mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '50000mb' }));
app.use(bodyParser.json());
app.use(csrfGuard);
app.use(express.static('uploads'));
cleanupOrphanedVevoTempFiles();
// Public Smart Link pages live at the app root (/l/:slug) — mounted before the
// module router so the raw-HTML responses aren't wrapped by the API layer.
app.use('/l', SmartLinkPublicRoutes);

app.use('/', routes);

app.get('/', async (req: Request, res: Response) => {
  res.json('Hey, Welcome to ANS Music Distribution Server');
});

app.use(globalErrorHandler);
app.set('view engine', 'ejs');
app.use(NotFoundHandler.handle);
