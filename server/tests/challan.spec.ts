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

async function createDraft(fixture: Fixture, items: { productId: string; quantity: number }[]) {
  return request(app).post('/api/challans').set(...bearer(fixture.tokens.ADMIN)).send({
    customerId: fixture.customers[0].id,
    deliveryAddress: '123 Test Road',
    installationSiteName: 'Site A',
    items,
  });
}

describe('challans', () => {
  it('creates a draft with snapshot items and does not touch stock', async () => {
    const before0 = fx.products[0].currentStock;
    const before1 = fx.products[1].currentStock;
    const r = await createDraft(fx, [
      { productId: fx.products[0].id, quantity: 3 },
      { productId: fx.products[1].id, quantity: 2 },
    ]);
    expect(r.status).toBe(201);
    expect(r.body.data.status).toBe('DRAFT');
    expect(r.body.data.items).toHaveLength(2);
    expect(r.body.data.items[0]).toHaveProperty('productNameSnapshot');
    expect(r.body.data.items[0]).toHaveProperty('unitPriceSnapshot');
    expect(r.body.data.challanNumber).toMatch(/^SDC-\d{8}-[A-F0-9]{6}$/);
    const p0 = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    const p1 = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[1].id } });
    expect(p0.currentStock).toBe(before0);
    expect(p1.currentStock).toBe(before1);
  });

  it('aggregates duplicate product lines on create (qty 2 + 3 → 1 line, qty 5)', async () => {
    const r = await createDraft(fx, [
      { productId: fx.products[0].id, quantity: 2 },
      { productId: fx.products[0].id, quantity: 3 },
    ]);
    expect(r.status).toBe(201);
    expect(r.body.data.items).toHaveLength(1);
    expect(r.body.data.items[0].quantity).toBe(5);
    expect(r.body.data.totalQuantity).toBe(5);
  });

  it('rejects a challan with no items (400)', async () => {
    const r = await request(app).post('/api/challans').set(...bearer(fx.tokens.ADMIN)).send({
      customerId: fx.customers[0].id, deliveryAddress: 'X', items: [],
    });
    expect(r.status).toBe(400);
  });

  it('confirm reduces stock atomically, creates OUT movements, sets status/confirmedAt', async () => {
    const before0 = fx.products[0].currentStock;
    const before1 = fx.products[1].currentStock;
    const draft = await createDraft(fx, [
      { productId: fx.products[0].id, quantity: 4 },
      { productId: fx.products[1].id, quantity: 2 },
    ]);
    const cid = draft.body.data.id;
    const r = await request(app).post(`/api/challans/${cid}/confirm`).set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(200);
    expect(r.body.data.status).toBe('CONFIRMED');
    expect(r.body.data.confirmedAt).toBeTruthy();

    const p0 = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    const p1 = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[1].id } });
    expect(p0.currentStock).toBe(before0 - 4);
    expect(p1.currentStock).toBe(before1 - 2);

    const outs = await prisma.stockMovement.findMany({
      where: { referenceType: 'SALES_CHALLAN', referenceId: cid, movementType: 'OUT' },
    });
    expect(outs).toHaveLength(2);
    expect(outs.reduce((s, m) => s + m.quantityChanged, 0)).toBe(6);
  });

  it('insufficient stock at confirm returns 409 and leaves EVERY product unchanged (full rollback)', async () => {
    const before0 = fx.products[0].currentStock; // 100
    const before2 = fx.products[2].currentStock; // 2
    // Draft has one shippable line and one that will fail — rollback must revert both.
    const draft = await createDraft(fx, [
      { productId: fx.products[0].id, quantity: 3 },
      { productId: fx.products[2].id, quantity: 999 },
    ]);
    const cid = draft.body.data.id;
    const r = await request(app).post(`/api/challans/${cid}/confirm`).set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('INSUFFICIENT_STOCK');

    const p0 = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    const p2 = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[2].id } });
    expect(p0.currentStock).toBe(before0);
    expect(p2.currentStock).toBe(before2);
    const outs = await prisma.stockMovement.findMany({ where: { referenceId: cid } });
    expect(outs).toHaveLength(0);
    const challan = await prisma.salesChallan.findUniqueOrThrow({ where: { id: cid } });
    expect(challan.status).toBe('DRAFT');
    expect(challan.confirmedAt).toBeNull();
  });

  it('cannot confirm a challan twice (409 INVALID_STATE)', async () => {
    const draft = await createDraft(fx, [{ productId: fx.products[0].id, quantity: 1 }]);
    const cid = draft.body.data.id;
    const first = await request(app).post(`/api/challans/${cid}/confirm`).set(...bearer(fx.tokens.ADMIN));
    expect(first.status).toBe(200);
    const second = await request(app).post(`/api/challans/${cid}/confirm`).set(...bearer(fx.tokens.ADMIN));
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('INVALID_STATE');
  });

  it('cannot confirm a CANCELLED challan (409)', async () => {
    const draft = await createDraft(fx, [{ productId: fx.products[0].id, quantity: 1 }]);
    const cid = draft.body.data.id;
    await request(app).post(`/api/challans/${cid}/cancel`).set(...bearer(fx.tokens.ADMIN));
    const r = await request(app).post(`/api/challans/${cid}/confirm`).set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('INVALID_STATE');
  });

  it('cancelling a CONFIRMED challan restores stock and writes IN reversal movements', async () => {
    const before0 = fx.products[0].currentStock;
    const draft = await createDraft(fx, [{ productId: fx.products[0].id, quantity: 7 }]);
    const cid = draft.body.data.id;
    await request(app).post(`/api/challans/${cid}/confirm`).set(...bearer(fx.tokens.ADMIN));
    const after = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    expect(after.currentStock).toBe(before0 - 7);

    const cancel = await request(app).post(`/api/challans/${cid}/cancel`).set(...bearer(fx.tokens.ADMIN));
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('CANCELLED');
    expect(cancel.body.data.cancelledAt).toBeTruthy();

    const restored = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    expect(restored.currentStock).toBe(before0);

    const reversals = await prisma.stockMovement.findMany({
      where: { referenceType: 'SALES_CHALLAN_REVERSAL', referenceId: cid, movementType: 'IN' },
    });
    expect(reversals).toHaveLength(1);
    expect(reversals[0].quantityChanged).toBe(7);
  });

  it('cancelling a DRAFT challan sets status but does not touch stock or write movements', async () => {
    const before0 = fx.products[0].currentStock;
    const draft = await createDraft(fx, [{ productId: fx.products[0].id, quantity: 3 }]);
    const cid = draft.body.data.id;
    const r = await request(app).post(`/api/challans/${cid}/cancel`).set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(200);
    expect(r.body.data.status).toBe('CANCELLED');
    const after = await prisma.product.findUniqueOrThrow({ where: { id: fx.products[0].id } });
    expect(after.currentStock).toBe(before0);
    const movements = await prisma.stockMovement.findMany({ where: { referenceId: cid } });
    expect(movements).toHaveLength(0);
  });

  it('cannot cancel the same challan twice (409 INVALID_STATE)', async () => {
    const draft = await createDraft(fx, [{ productId: fx.products[0].id, quantity: 1 }]);
    const cid = draft.body.data.id;
    const first = await request(app).post(`/api/challans/${cid}/cancel`).set(...bearer(fx.tokens.ADMIN));
    expect(first.status).toBe(200);
    const second = await request(app).post(`/api/challans/${cid}/cancel`).set(...bearer(fx.tokens.ADMIN));
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('INVALID_STATE');
  });

  it('challan numbers are unique across many creates', async () => {
    const numbers = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const r = await createDraft(fx, [{ productId: fx.products[0].id, quantity: 1 }]);
      expect(r.status).toBe(201);
      numbers.add(r.body.data.challanNumber);
    }
    expect(numbers.size).toBe(20);
  });
});

describe('dashboard', () => {
  it('returns numeric aggregates and recent lists', async () => {
    // Create some data to exercise the counters.
    const draft = await createDraft(fx, [{ productId: fx.products[0].id, quantity: 5 }]);
    await request(app).post(`/api/challans/${draft.body.data.id}/confirm`).set(...bearer(fx.tokens.ADMIN));

    const r = await request(app).get('/api/dashboard/summary').set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(200);
    const d = r.body.data;
    expect(typeof d.totalLeads).toBe('number');
    expect(typeof d.activeCustomers).toBe('number');
    expect(typeof d.lowStockProducts).toBe('number');
    expect(d.lowStockProducts).toBeGreaterThanOrEqual(1); // TST-CBL-6
    expect(d.confirmedChallansThisMonth).toBeGreaterThanOrEqual(1);
    expect(d.unitsDispatchedThisMonth).toBeGreaterThanOrEqual(5);
    expect(Array.isArray(d.recentMovements)).toBe(true);
    expect(Array.isArray(d.recentChallans)).toBe(true);
  });
});
