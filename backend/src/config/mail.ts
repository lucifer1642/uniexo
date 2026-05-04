import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

export const mailTransporter = nodemailer.createTransport(
  env.SMTP_HOST === 'smtp.gmail.com' 
    ? {
        service: 'gmail',
        pool: true,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
    : {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      }
);

mailTransporter.verify().then(() => {
  logger.info(`📧 Mail server connected successfully (${env.SMTP_USER})`);
}).catch((error) => {
  logger.error('❌ Mail server connection failed:', error);
});
