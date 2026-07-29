import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../config/prisma';

const router = Router();
router.use(authenticate);

router.get(
  '/summary',
  authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeads,
      activeCustomers,
      followUpsDueToday,
      siteSurveysScheduled,
      pipelineAgg,
      totalProducts,
      lowStockProducts,
      confirmedThisMonth,
      dispatchedAgg,
      recentMovements,
      recentChallans,
    ] = await Promise.all([
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { followUpDate: { gte: startOfDay, lt: endOfDay } } }),
      prisma.customer.count({ where: { siteSurveyDate: { gte: startOfDay } } }),
      prisma.customer.aggregate({ _sum: { estimatedSystemCapacityKw: true } }),
      prisma.product.count(),
      prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Product" WHERE "currentStock" <= "minimumStockAlertQuantity"`,
      prisma.salesChallan.count({
        where: { status: 'CONFIRMED', confirmedAt: { gte: startOfMonth } },
      }),
      prisma.salesChallan.aggregate({
        where: { status: 'CONFIRMED', confirmedAt: { gte: startOfMonth } },
        _sum: { totalQuantity: true },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, productName: true, sku: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalLeads,
        activeCustomers,
        followUpsDueToday,
        siteSurveysScheduled,
        pipelineCapacityKw: Number(pipelineAgg._sum.estimatedSystemCapacityKw ?? 0),
        totalProducts,
        lowStockProducts: Number(lowStockProducts[0]?.count ?? 0),
        confirmedChallansThisMonth: confirmedThisMonth,
        unitsDispatchedThisMonth: dispatchedAgg._sum.totalQuantity ?? 0,
        recentMovements,
        recentChallans,
      },
    });
  }),
);

export default router;
