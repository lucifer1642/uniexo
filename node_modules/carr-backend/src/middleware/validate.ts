import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { ResponseFormatter } from '../utils/response';

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(
          (e) => `${e.path.slice(1).join('.')}: ${e.message}`,
        );
        ResponseFormatter.badRequest(res, messages.join(', '));
        return;
      }
      next(error);
    }
  };
};
