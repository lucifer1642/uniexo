import rateLimit from 'express-rate-limit';
import { ResponseFormatter } from '../utils/response';

/**
 * Rate limits tuned for 10k+ concurrent users.
 *
 * Architecture note: With Vercel serverless, each cold-start gets its own
 * in-memory store. For truly distributed rate-limiting, use a Redis-backed
 * store (e.g. rate-limit-redis). For now, these per-instance limits are
 * generous enough that legitimate traffic won't be blocked, while still
 * protecting against single-IP abuse.
 */

// Global API limiter: 500 requests per 15 min per IP
// This is per-IP, so 10k unique users won't affect each other.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
  handler: (_req, res) => {
    ResponseFormatter.error(res, 429, 'Too many requests, please try again later');
  },
});

// Auth limiter: 30 attempts per 15 min per IP (login/signup/password-reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseFormatter.error(res, 429, 'Too many authentication attempts, try again later');
  },
});

// OTP limiter: 10 attempts per 5 min per IP
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseFormatter.error(res, 429, 'Too many OTP requests, try again later');
  },
});
