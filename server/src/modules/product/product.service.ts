import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type {
  ProductCreateInput,
  ProductUpdateInput,
  ProductListQuery,
  MovementCreateInput,
} from './product.schemas';

export async function list(q: ProductListQuery) {
  const where: Prisma.ProductWhereInput = {};
  if (q.category) where.category = q.category;
  if (q.search) {
    where.OR = [
      { productName: { contains: q.search, mode: 'insensitive' } },
      { sku: { contains: q.search, mode: 'insensitive' } },
      { brand: { contains: q.search, mode: 'insensitive' } },
      { modelNumber: { contains: q.search, mode: 'insensitive' } },
    ];
  }
  const [items, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.product.count({ where }),
  ]);

  const filtered = q.lowStock === 'true'
    ? items.filter((p) => p.currentStock <= p.minimumStockAlertQuantity)
    : items;

  return {
    data: filtered,
    pagination: {
      page: q.page,
      limit: q.limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / q.limit)),
    },
  };
}

export async function getById(id: string) {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) throw new AppError('Product not found', 404, 'NOT_FOUND');
  return p;
}

export async function create(input: ProductCreateInput) {
  return prisma.product.create({ data: input });
}

export async function update(id: string, input: ProductUpdateInput) {
  await getById(id);
  return prisma.product.update({ where: { id }, data: input });
}

export async function listMovements(productId: string) {
  await getById(productId);
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });
}

export async function createMovement(productId: string, userId: string, input: MovementCreateInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

    if (input.movementType === 'OUT') {
      const updated = await tx.product.updateMany({
        where: { id: productId, currentStock: { gte: input.quantity } },
        data: { currentStock: { decrement: input.quantity } },
      });
      if (updated.count === 0) {
        throw new AppError(
          `Insufficient stock for ${product.productName}. Available: ${product.currentStock}`,
          409,
          'INSUFFICIENT_STOCK',
        );
      }
    } else {
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: input.quantity } },
      });
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        quantityChanged: input.quantity,
        movementType: input.movementType,
        reason: input.reason,
        referenceType: 'MANUAL_ADJUSTMENT',
        createdById: userId,
      },
      include: {
        product: { select: { id: true, productName: true, sku: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
    return movement;
  });
}

export async function listAllMovements(page: number, limit: number) {
  const [items, totalItems] = await Promise.all([
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, productName: true, sku: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.stockMovement.count(),
  ]);
  return {
    data: items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    },
  };
}
