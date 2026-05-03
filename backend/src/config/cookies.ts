import type { CookieOptions } from 'express';
import { env } from './env';

/**
 * Refresh token must use SameSite=None in production so browsers send it on
 * cross-origin XHR (e.g. Next.js on Vercel calling a separate API origin).
 * Local dev stays lax + non-secure.
 */
export function refreshTokenCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

/** Options must match set-cookie attributes so the browser actually removes it. */
export function refreshTokenClearCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };
}
