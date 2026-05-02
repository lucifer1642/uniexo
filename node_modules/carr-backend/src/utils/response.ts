import { Response } from 'express';
import { ApiResponse } from '../types';

export class ResponseFormatter {
  static success<T>(res: Response, statusCode: number, message: string, data?: T): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, statusCode: number, message: string, error?: string): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ResponseFormatter.success(res, 201, message, data);
  }

  static ok<T>(res: Response, message: string, data?: T): Response {
    return ResponseFormatter.success(res, 200, message, data);
  }

  static badRequest(res: Response, message: string): Response {
    return ResponseFormatter.error(res, 400, message);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return ResponseFormatter.error(res, 401, message);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return ResponseFormatter.error(res, 403, message);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return ResponseFormatter.error(res, 404, message);
  }

  static conflict(res: Response, message: string): Response {
    return ResponseFormatter.error(res, 409, message);
  }

  static serverError(res: Response, message = 'Internal server error'): Response {
    return ResponseFormatter.error(res, 500, message);
  }
}
