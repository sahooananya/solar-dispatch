import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import customerRoutes from '../modules/customer/customer.routes';
import productRoutes, { stockMovementsRouter } from '../modules/product/product.routes';
import challanRoutes from '../modules/challan/challan.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/stock-movements', stockMovementsRouter);
router.use('/challans', challanRoutes);

export default router;
