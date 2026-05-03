import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';

let connectionListenersAttached = false;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = env.MONGODB_URI;
  if (!uri) {
    logger.warn('MONGODB_URI not set; skipping MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: env.NODE_ENV !== 'production',
    });
    logger.info('✅ MongoDB connected');

    if (!connectionListenersAttached) {
      connectionListenersAttached = true;
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });
    }
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
