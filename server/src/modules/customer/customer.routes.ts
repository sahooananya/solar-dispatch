import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerListQuerySchema,
  followUpCreateSchema,
} from './customer.schemas';
import * as service from './customer.service';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  validate(customerListQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.list(req.query as never);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  }),
);

router.post(
  '/',
  authorize('ADMIN', 'SALES'),
  validate(customerCreateSchema),
  asyncHandler(async (req, res) => {
    const customer = await service.create(req.body);
    res.status(201).json({ success: true, data: customer });
  }),
);

router.get(
  '/:customerId',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  asyncHandler(async (req, res) => {
    const c = await service.getById(req.params.customerId);
    res.json({ success: true, data: c });
  }),
);

router.patch(
  '/:customerId',
  authorize('ADMIN', 'SALES'),
  validate(customerUpdateSchema),
  asyncHandler(async (req, res) => {
    const c = await service.update(req.params.customerId, req.body);
    res.json({ success: true, data: c });
  }),
);

router.get(
  '/:customerId/follow-ups',
  authorize('ADMIN', 'SALES', 'ACCOUNTS'),
  asyncHandler(async (req, res) => {
    const items = await service.listFollowUps(req.params.customerId);
    res.json({ success: true, data: items });
  }),
);

router.post(
  '/:customerId/follow-ups',
  authorize('ADMIN', 'SALES'),
  validate(followUpCreateSchema),
  asyncHandler(async (req, res) => {
    const item = await service.createFollowUp(req.params.customerId, req.user!.sub, req.body);
    res.status(201).json({ success: true, data: item });
  }),
);

export default router;
