import admin from 'firebase-admin';
import { env } from './env';
import { logger } from './logger';

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'uniexo',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as any),
      databaseURL: env.FIREBASE_DATABASE_URL || "https://uniexo-default-rtdb.europe-west1.firebasedatabase.app/"
    });
    logger.info('[FIREBASE] Admin SDK Initialized for dual-sync protocol');
  }
} catch (error) {
  logger.error('[FIREBASE] Admin SDK Initialization failed', error);
}

export const firebaseDb: admin.database.Database = admin.database();
export const firebaseAuth: admin.auth.Auth = admin.auth();
