import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  productCreateSchema,
  productUpdateSchema,
  productListQuerySchema,
  movementCreateSchema,
} from './product.schemas';
import * as service from './product.service';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  validate(productListQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const r = await service.list(req.query as never);
    res.json({ success: true, data: r.data, pagination: r.pagination });
  }),
);

router.post(
  '/',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(productCreateSchema),
  asyncHandler(async (req, res) => {
    const p = await service.create(req.body);
    res.status(201).json({ success: true, data: p });
  }),
);

router.get(
  '/:productId',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  asyncHandler(async (req, res) => {
    const p = await service.getById(req.params.productId);
    res.json({ success: true, data: p });
  }),
);

router.patch(
  '/:productId',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(productUpdateSchema),
  asyncHandler(async (req, res) => {
    const p = await service.update(req.params.productId, req.body);
    res.json({ success: true, data: p });
  }),
);

router.get(
  '/:productId/movements',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  asyncHandler(async (req, res) => {
    const items = await service.listMovements(req.params.productId);
    res.json({ success: true, data: items });
  }),
);

router.post(
  '/:productId/movements',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(movementCreateSchema),
  asyncHandler(async (req, res) => {
    const m = await service.createMovement(req.params.productId, req.user!.sub, req.body);
    res.status(201).json({ success: true, data: m });
  }),
);

export const stockMovementsRouter = Router();
stockMovementsRouter.use(authenticate);
stockMovementsRouter.get(
  '/',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  validate(
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
    'query',
  ),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as { page: number; limit: number };
    const r = await service.listAllMovements(q.page, q.limit);
    res.json({ success: true, data: r.data, pagination: r.pagination });
  }),
);

export default router;
