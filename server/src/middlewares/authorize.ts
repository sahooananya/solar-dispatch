import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import type { JwtPayload } from './auth';

type Role = JwtPayload['role'];

export const authorize = (...allowed: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    next();
  };
