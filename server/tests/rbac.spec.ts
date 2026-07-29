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

describe('rbac', () => {
  it('SALES cannot POST /api/products/:id/movements (403 FORBIDDEN)', async () => {
    const r = await request(app)
      .post(`/api/products/${fx.products[0].id}/movements`)
      .set(...bearer(fx.tokens.SALES))
      .send({ movementType: 'IN', quantity: 5, reason: 'unauthorized attempt' });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('FORBIDDEN');
  });

  it('WAREHOUSE can POST /api/products/:id/movements (201)', async () => {
    const r = await request(app)
      .post(`/api/products/${fx.products[0].id}/movements`)
      .set(...bearer(fx.tokens.WAREHOUSE))
      .send({ movementType: 'IN', quantity: 5, reason: 'Restock test' });
    expect(r.status).toBe(201);
    expect(r.body.data.movementType).toBe('IN');
  });

  it('WAREHOUSE cannot add customer follow-ups (403)', async () => {
    const r = await request(app)
      .post(`/api/customers/${fx.customers[0].id}/follow-ups`)
      .set(...bearer(fx.tokens.WAREHOUSE))
      .send({ note: 'Should not be allowed' });
    expect(r.status).toBe(403);
  });

  it('SALES can add customer follow-ups (201)', async () => {
    const r = await request(app)
      .post(`/api/customers/${fx.customers[0].id}/follow-ups`)
      .set(...bearer(fx.tokens.SALES))
      .send({ note: 'Called client' });
    expect(r.status).toBe(201);
    expect(r.body.data.note).toBe('Called client');
  });

  it('ACCOUNTS cannot confirm a challan (403)', async () => {
    const draft = await request(app)
      .post('/api/challans')
      .set(...bearer(fx.tokens.ADMIN))
      .send({
        customerId: fx.customers[0].id,
        deliveryAddress: 'Test',
        items: [{ productId: fx.products[0].id, quantity: 1 }],
      });
    expect(draft.status).toBe(201);

    const r = await request(app)
      .post(`/api/challans/${draft.body.data.id}/confirm`)
      .set(...bearer(fx.tokens.ACCOUNTS));
    expect(r.status).toBe(403);
  });

  it('SALES cannot create or edit products (403)', async () => {
    const r = await request(app)
      .post('/api/products')
      .set(...bearer(fx.tokens.SALES))
      .send({ productName: 'X', sku: 'X-1', category: 'OTHER', unitPrice: 1, minimumStockAlertQuantity: 0, warehouseLocation: 'W' });
    expect(r.status).toBe(403);
  });
});
