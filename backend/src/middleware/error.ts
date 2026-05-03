import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { ResponseFormatter } from '../utils/response';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(err.message, { stack: err.stack });

  if (err instanceof AppError) {
    ResponseFormatter.error(res, err.statusCode, err.message);
    return;
  }

  // Zod validation error (instance check works across Zod 3/4)
  if (err instanceof ZodError) {
    const message =
      err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Validation error';
    ResponseFormatter.badRequest(res, message);
    return;
  }

  // Multer upload limits / parsing
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      ResponseFormatter.badRequest(res, 'File too large');
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      ResponseFormatter.badRequest(res, 'Too many files or unexpected field');
      return;
    }
    ResponseFormatter.badRequest(res, err.message || 'Upload error');
    return;
  }

  // Supabase PostgREST / Postgres (thrown as plain objects with .code)
  const pgCode = (err as { code?: string }).code;
  if (typeof pgCode === 'string') {
    if (pgCode === '23505') {
      ResponseFormatter.conflict(res, 'A record with this information already exists');
      return;
    }
    if (pgCode === '23503') {
      ResponseFormatter.badRequest(res, 'Referenced record does not exist');
      return;
    }
    if (pgCode === 'PGRST116') {
      ResponseFormatter.notFound(res, (err as Error).message || 'Resource not found');
      return;
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    ResponseFormatter.badRequest(res, err.message);
    return;
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0];
    ResponseFormatter.conflict(res, `${field} already exists`);
    return;
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    ResponseFormatter.badRequest(res, 'Invalid ID format');
    return;
  }

  // JSON parse error
  if (err.name === 'SyntaxError') {
    ResponseFormatter.badRequest(res, 'Invalid JSON');
    return;
  }

  // MongoDB unavailable (common on Vercel if MONGODB_URI is wrong or IP not allowlisted)
  if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    (typeof (err as Error).message === 'string' &&
      (err as Error).message.includes('connect ECONNREFUSED') &&
      (err as Error).message.includes('27017'))
  ) {
    ResponseFormatter.error(
      res,
      503,
      'Database unavailable. Verify MONGODB_URI and Atlas network access (allow 0.0.0.0/0 or Vercel).',
    );
    return;
  }

  ResponseFormatter.serverError(res);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  ResponseFormatter.notFound(res, 'Route not found');
};
