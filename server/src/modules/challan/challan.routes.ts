import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  challanCreateSchema,
  challanUpdateSchema,
  challanListQuerySchema,
} from './challan.schemas';
import * as service from './challan.service';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  validate(challanListQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const r = await service.list(req.query as never);
    res.json({ success: true, data: r.data, pagination: r.pagination });
  }),
);

router.post(
  '/',
  authorize('ADMIN', 'SALES'),
  validate(challanCreateSchema),
  asyncHandler(async (req, res) => {
    const c = await service.create(req.body, req.user!.sub);
    res.status(201).json({ success: true, data: c });
  }),
);

router.get(
  '/:challanId',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  asyncHandler(async (req, res) => {
    const c = await service.getById(req.params.challanId);
    res.json({ success: true, data: c });
  }),
);

router.patch(
  '/:challanId',
  authorize('ADMIN', 'SALES'),
  validate(challanUpdateSchema),
  asyncHandler(async (req, res) => {
    const c = await service.update(req.params.challanId, req.body);
    res.json({ success: true, data: c });
  }),
);

router.post(
  '/:challanId/confirm',
  authorize('ADMIN', 'SALES'),
  asyncHandler(async (req, res) => {
    const c = await service.confirm(req.params.challanId, req.user!.sub);
    res.json({ success: true, data: c });
  }),
);

router.post(
  '/:challanId/cancel',
  authorize('ADMIN', 'SALES'),
  asyncHandler(async (req, res) => {
    const c = await service.cancel(req.params.challanId, req.user!.sub);
    res.json({ success: true, data: c });
  }),
);

export default router;
