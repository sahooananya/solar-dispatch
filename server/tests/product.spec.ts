import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, seedFixture, bearer, Fixture } from './helpers';

let fx: Fixture;

beforeEach(async () => {
  await resetDb();
  fx = await seedFixture();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('products and inventory', () => {
  it('creates a product', async () => {
    const r = await request(app).post('/api/products').set(...bearer(fx.tokens.WAREHOUSE)).send({
      productName: '330W Poly Panel', sku: 'PP-330', category: 'SOLAR_PANEL',
      unitPrice: 8500, currentStock: 50, minimumStockAlertQuantity: 10, warehouseLocation: 'WH-A3',
    });
    expect(r.status).toBe(201);
    expect(r.body.data.sku).toBe('PP-330');
  });

  it('duplicate SKU returns 409 DUPLICATE_RECORD', async () => {
    const r = await request(app).post('/api/products').set(...bearer(fx.tokens.WAREHOUSE)).send({
      productName: 'Dup', sku: fx.products[0].sku, category: 'SOLAR_PANEL',
      unitPrice: 100, minimumStockAlertQuantity: 0, warehouseLocation: 'WH-X',
    });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('DUPLICATE_RECORD');
  });

  it('IN movement increases currentStock and logs a StockMovement', async () => {
    const before = fx.products[0].currentStock;
    const r = await request(app)
      .post(`/api/products/${fx.products[0].id}/movements`)
      .set(...bearer(fx.tokens.WAREHOUSE))
      .send({ movementType: 'IN', quantity: 25, reason: 'Purchase order' });
    expect(r.status).toBe(201);
    const p = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    expect(p.currentStock).toBe(before + 25);
    const movements = await prisma.stockMovement.findMany({ where: { productId: fx.products[0].id } });
    expect(movements).toHaveLength(1);
    expect(movements[0].movementType).toBe('IN');
    expect(movements[0].quantityChanged).toBe(25);
  });

  it('OUT movement within available stock decreases currentStock', async () => {
    const before = fx.products[0].currentStock;
    const r = await request(app)
      .post(`/api/products/${fx.products[0].id}/movements`)
      .set(...bearer(fx.tokens.WAREHOUSE))
      .send({ movementType: 'OUT', quantity: 30, reason: 'Site dispatch' });
    expect(r.status).toBe(201);
    const p = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    expect(p.currentStock).toBe(before - 30);
  });

  it('OUT exceeding stock returns 409 INSUFFICIENT_STOCK and leaves both tables unchanged', async () => {
    const before = fx.products[2].currentStock; // low-stock product = 2
    const r = await request(app)
      .post(`/api/products/${fx.products[2].id}/movements`)
      .set(...bearer(fx.tokens.WAREHOUSE))
      .send({ movementType: 'OUT', quantity: 999, reason: 'Overshoot' });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('INSUFFICIENT_STOCK');
    const p = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[2].id } });
    expect(p.currentStock).toBe(before);
    const movements = await prisma.stockMovement.findMany({ where: { productId: fx.products[2].id } });
    expect(movements).toHaveLength(0);
  });

  it('rejects zero or negative movement quantity via validation', async () => {
    const zero = await request(app)
      .post(`/api/products/${fx.products[0].id}/movements`)
      .set(...bearer(fx.tokens.WAREHOUSE))
      .send({ movementType: 'IN', quantity: 0, reason: 'Bad' });
    expect(zero.status).toBe(400);
    const neg = await request(app)
      .post(`/api/products/${fx.products[0].id}/movements`)
      .set(...bearer(fx.tokens.WAREHOUSE))
      .send({ movementType: 'IN', quantity: -5, reason: 'Bad' });
    expect(neg.status).toBe(400);
  });

  it('lowStock=true filter returns products where currentStock <= minimum', async () => {
    const r = await request(app).get('/api/products?lowStock=true&limit=50').set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(200);
    const skus = (r.body.data as { sku: string; currentStock: number; minimumStockAlertQuantity: number }[]).map((p) => p.sku);
    expect(skus).toContain(fx.products[2].sku); // TST-CBL-6 stock 2 vs min 50
    for (const p of r.body.data as { currentStock: number; minimumStockAlertQuantity: number }[]) {
      expect(p.currentStock).toBeLessThanOrEqual(p.minimumStockAlertQuantity);
    }
  });
});
