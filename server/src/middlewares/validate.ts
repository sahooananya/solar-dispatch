import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Target = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: Target = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        (fieldErrors[key] ||= []).push(issue.message);
      }
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', fieldErrors));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[target] = result.data;
    next();
  };
