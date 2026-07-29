import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type {
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerListQuery,
  FollowUpCreateInput,
} from './customer.schemas';

export async function list(q: CustomerListQuery) {
  const where: Prisma.CustomerWhereInput = {};
  if (q.customerType) where.customerType = q.customerType;
  if (q.status) where.status = q.status;
  if (q.search) {
    where.OR = [
      { customerName: { contains: q.search, mode: 'insensitive' } },
      { businessName: { contains: q.search, mode: 'insensitive' } },
      { mobileNumber: { contains: q.search } },
      { email: { contains: q.search, mode: 'insensitive' } },
    ];
  }
  const [items, totalItems] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.customer.count({ where }),
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
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true, role: true } } },
      },
      challans: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          challanNumber: true,
          status: true,
          totalQuantity: true,
          createdAt: true,
          confirmedAt: true,
        },
      },
    },
  });
  if (!customer) throw new AppError('Customer not found', 404, 'NOT_FOUND');
  return customer;
}

export async function create(input: CustomerCreateInput) {
  return prisma.customer.create({ data: input });
}

export async function update(id: string, input: CustomerUpdateInput) {
  await getById(id);
  return prisma.customer.update({ where: { id }, data: input });
}

export async function listFollowUps(customerId: string) {
  await getById(customerId);
  return prisma.customerFollowUp.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });
}

export async function createFollowUp(customerId: string, userId: string, input: FollowUpCreateInput) {
  await getById(customerId);
  const created = await prisma.customerFollowUp.create({
    data: {
      customerId,
      note: input.note,
      followUpType: input.followUpType ?? null,
      nextFollowUpDate: input.nextFollowUpDate ?? null,
      createdById: userId,
    },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });
  if (input.nextFollowUpDate) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { followUpDate: input.nextFollowUpDate },
    });
  }
  return created;
}
