import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from './config/env';
import { logger } from './config/logger';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/error';
import routes from './routes';
import cron from 'node-cron';
import { ReminderJob } from './jobs/reminder.job';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { connectDatabase } from './database/connection';

const app = express();

// ─── Trust Proxy (CRITICAL for Vercel/Cloudflare/any reverse proxy) ──
// Required so rate-limiter uses the real client IP, not the proxy IP.
// Without this, ALL users share a single rate-limit bucket → mass lockout.
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── Response Compression ────────────────────────────────
// Gzip/Brotli all responses > 1KB. Reduces payload by 60-80%.
// 10k users × 10KB avg response = 100MB → 20MB with compression.
app.use(compression({
  level: 6,      // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client says no
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ─── Security Headers ────────────────────────────────────
// Helmet sets ~15 security headers that prevent firewalls from
// flagging the app as suspicious (X-Content-Type, CSP, HSTS, etc.)
app.use(helmet({
  // Relax CSP for API-only backend (no HTML served)
  contentSecurityPolicy: false,
  // Allow cross-origin requests (needed for frontend on different domain)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // HSTS: tell browsers to always use HTTPS
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
  },
}));

// ─── CORS (Firewall-Friendly) ────────────────────────────
// Properly configured CORS prevents firewalls from blocking
// cross-origin requests. The OPTIONS preflight response includes
// all necessary headers so corporate firewalls pass it through.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, health checks)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        env.CLIENT_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://uniexo.in',
        'https://www.uniexo.in',
      ];

      // Allow any vercel domain automatically
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        logger.warn(`CORS denied origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // Cache preflight for 24h — reduces OPTIONS requests by 99%
  }),
);

// ─── Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Rate Limiting ───────────────────────────────────────
app.use(globalLimiter);

// ─── Health Check (bypasses rate limiter) ────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
  });
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Frontend Proxy (Integrated Mode / Local Dev Only) ───
if (!process.env.VERCEL) {
  app.use(
    '/',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      ws: true,
      pathFilter: (pathname: string) => !pathname.startsWith('/api') && !pathname.startsWith('/health'),
    }),
  );
}

// ─── Scheduled Jobs (long-running servers only; skip Vercel) ─
if (!process.env.VERCEL) {
  cron.schedule('0 0 * * *', () => {
    ReminderJob.run();
  });
}

// ─── Error Handling ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDatabase();
    if (!process.env.VERCEL) {
      app.listen(env.PORT, () => {
        logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        logger.info(`📊 Rate limit: 500 req/15min per IP | DB pool: 50 connections`);
      });
    } else {
      logger.info('🚀 App initialized for Vercel Serverless environment');
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

if (!process.env.VERCEL) {
  startServer();
} else {
  logger.info('🚀 App initialized for Vercel Serverless environment');
}

export default app;
