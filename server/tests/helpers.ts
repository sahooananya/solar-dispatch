import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { PrismaClient, ProductCategory } from '@prisma/client';
import { createApp } from '../src/app';
import { env } from '../src/config/env';

export const prisma = new PrismaClient();
export const app = createApp();

export async function resetDb(): Promise<void> {
  // Truncate all tables and restart identity — respects FK ordering via CASCADE.
  await prisma.$executeRawUnsafe(
    `TRUNCATE "SalesChallanItem","SalesChallan","StockMovement","CustomerFollowUp","Customer","Product","User" RESTART IDENTITY CASCADE`,
  );
}

export interface Fixture {
  users: Record<'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS', { id: string; email: string; password: string }>;
  products: Array<{ id: string; sku: string; productName: string; currentStock: number; unitPrice: number }>;
  customers: Array<{ id: string; customerName: string }>;
  tokens: Record<'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS', string>;
}

const PASSWORD = 'Password@Test123';

export async function seedFixture(): Promise<Fixture> {
  const hash = await bcrypt.hash(PASSWORD, 8);
  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.create({ data: { name: 'Test Admin', email: 'admin@test.local', passwordHash: hash, role: 'ADMIN' } }),
    prisma.user.create({ data: { name: 'Test Sales', email: 'sales@test.local', passwordHash: hash, role: 'SALES' } }),
    prisma.user.create({ data: { name: 'Test Warehouse', email: 'warehouse@test.local', passwordHash: hash, role: 'WAREHOUSE' } }),
    prisma.user.create({ data: { name: 'Test Accounts', email: 'accounts@test.local', passwordHash: hash, role: 'ACCOUNTS' } }),
  ]);

  const [p1, p2, p3] = await Promise.all([
    prisma.product.create({
      data: {
        productName: 'Test 550W Panel', sku: 'TST-PANEL-550', category: ProductCategory.SOLAR_PANEL,
        unitPrice: 12500, currentStock: 100, minimumStockAlertQuantity: 20, warehouseLocation: 'WH-A1',
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Test 5kW Inverter', sku: 'TST-INV-5KW', category: ProductCategory.INVERTER,
        unitPrice: 48000, currentStock: 15, minimumStockAlertQuantity: 5, warehouseLocation: 'WH-B1',
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Test Low Stock Cable', sku: 'TST-CBL-6', category: ProductCategory.DC_CABLE,
        unitPrice: 65, currentStock: 2, minimumStockAlertQuantity: 50, warehouseLocation: 'WH-D1',
      },
    }),
  ]);

  const [c1, c2] = await Promise.all([
    prisma.customer.create({
      data: {
        customerName: 'Rohan Test', mobileNumber: '9820011122', email: 'rohan@test.local',
        address: '1 Test Street', customerType: 'RETAIL', status: 'LEAD',
        propertyType: 'RESIDENTIAL', estimatedSystemCapacityKw: 5,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: 'Iyer Farms Test', businessName: 'Iyer Farms', mobileNumber: '9765432101',
        address: '2 Farm Road', customerType: 'WHOLESALE', status: 'ACTIVE', gstNumber: '27ABCDE1234F1Z5',
      },
    }),
  ]);

  // Sign tokens directly to avoid hitting the login rate limiter across dozens of tests.
  // The /api/auth/login endpoint itself is exercised end-to-end in auth.spec.ts.
  const signToken = (userId: string, role: Fixture['users'][keyof Fixture['users']] extends { id: string } ? string : never): string =>
    jwt.sign({ sub: userId, role }, env.JWT_SECRET, { expiresIn: '1h' });
  const tokens: Fixture['tokens'] = {
    ADMIN: signToken(admin.id, 'ADMIN'),
    SALES: signToken(sales.id, 'SALES'),
    WAREHOUSE: signToken(warehouse.id, 'WAREHOUSE'),
    ACCOUNTS: signToken(accounts.id, 'ACCOUNTS'),
  };

  return {
    users: {
      ADMIN: { id: admin.id, email: admin.email, password: PASSWORD },
      SALES: { id: sales.id, email: sales.email, password: PASSWORD },
      WAREHOUSE: { id: warehouse.id, email: warehouse.email, password: PASSWORD },
      ACCOUNTS: { id: accounts.id, email: accounts.email, password: PASSWORD },
    },
    products: [
      { id: p1.id, sku: p1.sku, productName: p1.productName, currentStock: p1.currentStock, unitPrice: Number(p1.unitPrice) },
      { id: p2.id, sku: p2.sku, productName: p2.productName, currentStock: p2.currentStock, unitPrice: Number(p2.unitPrice) },
      { id: p3.id, sku: p3.sku, productName: p3.productName, currentStock: p3.currentStock, unitPrice: Number(p3.unitPrice) },
    ],
    customers: [
      { id: c1.id, customerName: c1.customerName },
      { id: c2.id, customerName: c2.customerName },
    ],
    tokens,
  };
}

export function bearer(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}
