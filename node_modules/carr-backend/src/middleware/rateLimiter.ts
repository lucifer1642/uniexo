import rateLimit from 'express-rate-limit';
import { ResponseFormatter } from '../utils/response';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseFormatter.error(res, 429, 'Too many requests, please try again later');
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseFormatter.error(res, 429, 'Too many authentication attempts, try again later');
  },
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseFormatter.error(res, 429, 'Too many OTP requests, try again later');
  },
});
