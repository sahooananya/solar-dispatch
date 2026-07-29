import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { generateChallanNumber } from '../../utils/challanNumber';
import type { ChallanCreateInput, ChallanUpdateInput, ChallanListQuery } from './challan.schemas';

const challanInclude = {
  customer: {
    select: {
      id: true,
      customerName: true,
      businessName: true,
      mobileNumber: true,
      email: true,
      gstNumber: true,
      address: true,
      installationAddress: true,
    },
  },
  items: true,
  createdBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.SalesChallanInclude;

function aggregateItems(items: ChallanCreateInput['items']) {
  const map = new Map<string, number>();
  for (const it of items) {
    map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  }
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

export async function list(q: ChallanListQuery) {
  const where: Prisma.SalesChallanWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.customerId) where.customerId = q.customerId;
  if (q.search) {
    where.OR = [
      { challanNumber: { contains: q.search, mode: 'insensitive' } },
      { customer: { customerName: { contains: q.search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: q.search, mode: 'insensitive' } } },
    ];
  }
  const [items, totalItems] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: challanInclude,
    }),
    prisma.salesChallan.count({ where }),
  ]);
  return {
    data: items,
    pagination: {
      page: q.page,
      limit: q.limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / q.limit)),
    },
  };
}

export async function getById(id: string) {
  const c = await prisma.salesChallan.findUnique({ where: { id }, include: challanInclude });
  if (!c) throw new AppError('Challan not found', 404, 'NOT_FOUND');
  return c;
}

export async function create(input: ChallanCreateInput, userId: string) {
  const aggregated = aggregateItems(input.items);
  const productIds = aggregated.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    throw new AppError('One or more products were not found', 404, 'NOT_FOUND');
  }
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new AppError('Customer not found', 404, 'NOT_FOUND');

  const totalQuantity = aggregated.reduce((sum, i) => sum + i.quantity, 0);

  let attempt = 0;
  while (attempt < 3) {
    attempt += 1;
    try {
      const challanNumber = generateChallanNumber();
      return await prisma.salesChallan.create({
        data: {
          challanNumber,
          customerId: input.customerId,
          deliveryAddress: input.deliveryAddress,
          dispatchNotes: input.dispatchNotes,
          installationSiteName: input.installationSiteName,
          projectReference: input.projectReference,
          proposedSystemCapacityKw: input.proposedSystemCapacityKw ?? null,
          expectedDispatchDate: input.expectedDispatchDate ?? null,
          totalQuantity,
          createdById: userId,
          items: {
            create: aggregated.map((it) => {
              const p = products.find((pp) => pp.id === it.productId)!;
              return {
                productId: p.id,
                quantity: it.quantity,
                productNameSnapshot: p.productName,
                skuSnapshot: p.sku,
                categorySnapshot: p.category,
                unitPriceSnapshot: p.unitPrice,
              };
            }),
          },
        },
        include: challanInclude,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        attempt < 3
      ) {
        continue;
      }
      throw err;
    }
  }
  throw new AppError('Failed to generate a unique challan number', 500, 'INTERNAL_ERROR');
}

export async function update(id: string, input: ChallanUpdateInput) {
  const existing = await getById(id);
  if (existing.status !== 'DRAFT') {
    throw new AppError('Only DRAFT challans can be edited', 409, 'INVALID_STATE');
  }

  return prisma.$transaction(async (tx) => {
    if (input.items) {
      const aggregated = aggregateItems(input.items);
      const productIds = aggregated.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) {
        throw new AppError('One or more products were not found', 404, 'NOT_FOUND');
      }
      await tx.salesChallanItem.deleteMany({ where: { salesChallanId: id } });
      await tx.salesChallanItem.createMany({
        data: aggregated.map((it) => {
          const p = products.find((pp) => pp.id === it.productId)!;
          return {
            salesChallanId: id,
            productId: p.id,
            quantity: it.quantity,
            productNameSnapshot: p.productName,
            skuSnapshot: p.sku,
            categorySnapshot: p.category,
            unitPriceSnapshot: p.unitPrice,
          };
        }),
      });
    }
    const totalQuantity = input.items
      ? aggregateItems(input.items).reduce((sum, i) => sum + i.quantity, 0)
      : existing.totalQuantity;

    return tx.salesChallan.update({
      where: { id },
      data: {
        customerId: input.customerId ?? undefined,
        deliveryAddress: input.deliveryAddress ?? undefined,
        dispatchNotes: input.dispatchNotes ?? undefined,
        installationSiteName: input.installationSiteName ?? undefined,
        projectReference: input.projectReference ?? undefined,
        proposedSystemCapacityKw: input.proposedSystemCapacityKw ?? undefined,
        expectedDispatchDate: input.expectedDispatchDate ?? undefined,
        totalQuantity,
      },
      include: challanInclude,
    });
  });
}

export async function confirm(id: string, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      const challan = await tx.salesChallan.findUnique({ where: { id }, include: { items: true } });
      if (!challan) throw new AppError('Challan not found', 404, 'NOT_FOUND');
      if (challan.status === 'CONFIRMED') {
        throw new AppError('Challan is already confirmed', 409, 'INVALID_STATE');
      }
      if (challan.status === 'CANCELLED') {
        throw new AppError('Cancelled challans cannot be confirmed', 409, 'INVALID_STATE');
      }

      for (const it of challan.items) {
        const upd = await tx.product.updateMany({
          where: { id: it.productId, currentStock: { gte: it.quantity } },
          data: { currentStock: { decrement: it.quantity } },
        });
        if (upd.count === 0) {
          throw new AppError(
            `Insufficient stock for ${it.productNameSnapshot}`,
            409,
            'INSUFFICIENT_STOCK',
          );
        }
        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            quantityChanged: it.quantity,
            movementType: 'OUT',
            reason: `Challan confirmation ${challan.challanNumber}`,
            referenceType: 'SALES_CHALLAN',
            referenceId: challan.id,
            createdById: userId,
          },
        });
      }

      return tx.salesChallan.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
        include: challanInclude,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function cancel(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.salesChallan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw new AppError('Challan not found', 404, 'NOT_FOUND');
    if (challan.status === 'CANCELLED') {
      throw new AppError('Challan is already cancelled', 409, 'INVALID_STATE');
    }

    if (challan.status === 'CONFIRMED') {
      for (const it of challan.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { currentStock: { increment: it.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            quantityChanged: it.quantity,
            movementType: 'IN',
            reason: `Challan cancellation reversal ${challan.challanNumber}`,
            referenceType: 'SALES_CHALLAN_REVERSAL',
            referenceId: challan.id,
            createdById: userId,
          },
        });
      }
    }

    return tx.salesChallan.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: challanInclude,
    });
  });
}
