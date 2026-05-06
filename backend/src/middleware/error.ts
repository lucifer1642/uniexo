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

  // JSON parse error
  if (err.name === 'SyntaxError') {
    ResponseFormatter.badRequest(res, 'Invalid JSON');
    return;
  }

  // Final fallback for unhandled errors
  const isProd = process.env.NODE_ENV === 'production';
  const errorMessage = isProd ? 'Internal server error' : `Unhandled Error: ${err.message}`;
  
  // LOG the actual error for Vercel/Production logs
  logger.error(`[GLOBAL-ERROR] ${err.name}: ${err.message}`, { 
    stack: err.stack,
    url: _req.url,
    method: _req.method
  });

  ResponseFormatter.error(
    res, 
    500, 
    errorMessage,
    isProd ? undefined : err.stack
  );
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  ResponseFormatter.notFound(res, 'Route not found');
};
