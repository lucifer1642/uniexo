import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Priority:
// 1. backend/.env (when running from monorepo root)
// 2. .env (when running from backend dir directly)
const envPaths = [
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'), // Fallbacks
  path.resolve(__dirname, '../.env')
];

const envFile = envPaths.find(p => fs.existsSync(p));
if (envFile) {
  dotenv.config({ path: envFile });
} else {
  // On Vercel, env vars are injected by the platform — no .env file needed
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().optional(),

  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().optional().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_TLS: z.string().optional().default('false'),
  USE_MOCK_REDIS: z.string().optional().default('false'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRY: z.string().default('1d'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),

  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  DEFAULT_COMMISSION_PERCENT: z.coerce.number().min(0).max(100).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("=========================================");
  console.error("❌ ENV VALIDATION FAILED");
  console.error("The following environment variables are missing or invalid:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  console.error("=========================================");

  console.log("🔍 RAW ENV CHECK:");
  console.log({
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI ? "DEFINED" : "MISSING",
    PORT: process.env.PORT,
    REDIS_URL: process.env.REDIS_URL ? "DEFINED" : "MISSING",
  });
  console.error("💡 TIP: Make sure these variables are set in the Render Dashboard.");
  
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
