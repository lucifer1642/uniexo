import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import { env } from './config/env';
import { logger } from './config/logger';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/error';
import routes from './routes';
import cron from 'node-cron';
import { ReminderJob } from './jobs/reminder.job';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NexusSocketService } from './services/nexus.socket';
import { OTPEngine } from './services/otp.service';

const app = express();
const server = createServer(app);

// ─── Trust Proxy ─────────────────────────────────────────
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── Response Compression ────────────────────────────────
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: express.Request, res: express.Response) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ─── Security Headers ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

// ─── CORS ────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
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
    maxAge: 86400,
  }),
);

// ─── Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Rate Limiting ───────────────────────────────────────
app.use(globalLimiter);

// ─── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    nexus: {
      activeUsers: NexusSocketService.getInstance().getActiveCount(),
    }
  });
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}, routes);

// ─── Frontend Proxy (Local Dev) ──────────────────────────
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

// ─── Scheduled Jobs ──────────────────────────────────────
if (!process.env.VERCEL) {
  cron.schedule('0 0 * * *', () => {
    ReminderJob.run();
  });

  // Purge expired OTPs every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    OTPEngine.cleanup().catch(err => {
      logger.error('[CRON] OTP cleanup failed:', err);
    });
  });
}

// ─── Error Handling ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
const startServer = async () => {
  try {
    // Initialize Nexus Real-time Engine
    NexusSocketService.getInstance().init(server);

    // Test Supabase Connection
    const { supabase } = await import('./config/supabase');
    const { data: testData, error: testError } = await supabase.from('profiles').select('id').limit(1);
    if (testError) {
      logger.error('❌ Supabase connection test failed:', testError.message);
      // We don't exit here to allow failover to Firebase if implemented, but we warn loudly
    } else {
      logger.info('✅ Supabase connection verified successfully');
    }

    if (!process.env.VERCEL) {
      server.listen(env.PORT, () => {
        logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        logger.info(`📊 Nexus Real-time Engine initialized`);
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
  // On Vercel, we still need to call startServer to init DB/middleware
  // but Vercel handles the actual listening
  startServer();
}

export default app;
