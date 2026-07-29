import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { env } from '../../config/env';
import { loginSchema } from './auth.schemas';
import * as service from './auth.service';

const router = Router();

const rateLimitedLoginHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.', fieldErrors: null },
  },
});

// Skip the limiter entirely in the automated-test environment.
const loginLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (env.NODE_ENV === 'test') return next();
  rateLimitedLoginHandler(req, res, next);
};

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.login(req.body);
    res.json({ success: true, data: result });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await service.getCurrentUser(req.user!.sub);
    res.json({ success: true, data: user });
  }),
);

export default router;
