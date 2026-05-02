import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const redisOptions: RedisOptions = env.REDIS_URL ?
  (env.REDIS_URL.startsWith('rediss://') ? { tls: { rejectUnauthorized: false }, maxRetriesPerRequest: 3, enableOfflineQueue: false, commandTimeout: 5000 } : { maxRetriesPerRequest: 3, enableOfflineQueue: false, commandTimeout: 5000 })
  : {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
    ...(env.REDIS_TLS === 'true' && { tls: { rejectUnauthorized: false } }),
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    commandTimeout: 5000,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  };

// Conditionally import ioredis-mock only if needed
let redisInstance: Redis;
if (env.USE_MOCK_REDIS === 'true') {
  const { default: RedisMock } = await import('ioredis-mock');
  redisInstance = new (RedisMock as any)() as Redis;
} else {
  redisInstance = env.REDIS_URL ? new Redis(env.REDIS_URL, redisOptions) : new Redis(redisOptions);
}

export const redis = redisInstance;

redis.on('connect', () => {
  logger.info(env.USE_MOCK_REDIS === 'true' ? '✅ Mock Redis connected' : '✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});
