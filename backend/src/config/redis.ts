/**
 * Redis is disabled — all auth/session state lives in Supabase.
 * This stub keeps any legacy imports from crashing the server.
 */
import { logger } from './logger';

const noop = async (..._args: any[]) => {};

const stub: any = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === 'on') return noop;
    if (prop === 'get') return async () => null;
    if (prop === 'set') return noop;
    if (prop === 'del') return noop;
    if (prop === 'exists') return async () => 0;
    if (prop === 'quit') return noop;
    return noop;
  },
});

logger.info('Redis disabled — using Supabase for session storage.');

export const redis = stub;
