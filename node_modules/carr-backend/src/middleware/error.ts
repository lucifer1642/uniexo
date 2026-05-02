import { Request, Response, NextFunction } from 'express';
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

  ResponseFormatter.serverError(res);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  ResponseFormatter.notFound(res, 'Route not found');
};
