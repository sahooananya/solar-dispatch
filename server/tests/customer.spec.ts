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

describe('customers', () => {
  it('creates a valid customer', async () => {
    const r = await request(app).post('/api/customers').set(...bearer(fx.tokens.ADMIN)).send({
      customerName: 'New Lead',
      mobileNumber: '9000011111',
      email: 'new@lead.local',
      address: 'Somewhere, 411001',
      customerType: 'RETAIL',
      status: 'LEAD',
    });
    expect(r.status).toBe(201);
    expect(r.body.data.email).toBe('new@lead.local');
  });

  it('rejects invalid email with 400 VALIDATION_ERROR', async () => {
    const r = await request(app).post('/api/customers').set(...bearer(fx.tokens.ADMIN)).send({
      customerName: 'Bad', mobileNumber: '9000000000', email: 'not-email', address: 'Somewhere',
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    expect(r.body.error.fieldErrors.email?.[0]).toMatch(/valid email/i);
  });

  it('searches by name (case-insensitive)', async () => {
    const r = await request(app).get('/api/customers?search=IYER').set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(200);
    expect(r.body.data.some((c: { businessName?: string }) => c.businessName === 'Iyer Farms')).toBe(true);
  });

  it('filters by status', async () => {
    const r = await request(app).get('/api/customers?status=ACTIVE').set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(200);
    for (const c of r.body.data as { status: string }[]) {
      expect(c.status).toBe('ACTIVE');
    }
  });

  it('detail includes newest-first follow-ups and any related challans', async () => {
    const cid = fx.customers[0].id;
    await request(app).post(`/api/customers/${cid}/follow-ups`).set(...bearer(fx.tokens.SALES)).send({ note: 'First contact' });
    await new Promise((r) => setTimeout(r, 20));
    await request(app).post(`/api/customers/${cid}/follow-ups`).set(...bearer(fx.tokens.SALES)).send({ note: 'Second call' });

    const r = await request(app).get(`/api/customers/${cid}`).set(...bearer(fx.tokens.ADMIN));
    expect(r.status).toBe(200);
    expect(r.body.data.followUps).toHaveLength(2);
    expect(r.body.data.followUps[0].note).toBe('Second call');
    expect(Array.isArray(r.body.data.challans)).toBe(true);
  });

  it('creating a follow-up with nextFollowUpDate updates Customer.followUpDate', async () => {
    const cid = fx.customers[0].id;
    const iso = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const r = await request(app).post(`/api/customers/${cid}/follow-ups`).set(...bearer(fx.tokens.SALES)).send({
      note: 'Scheduled call', nextFollowUpDate: iso,
    });
    expect(r.status).toBe(201);
    const c = await prisma.customer.findUniqueOrThrow({ where: { id: cid } });
    expect(c.followUpDate?.toISOString().slice(0, 10)).toBe(iso);
  });

  it('follow-up history is append-only (adding new does not overwrite old)', async () => {
    const cid = fx.customers[0].id;
    await request(app).post(`/api/customers/${cid}/follow-ups`).set(...bearer(fx.tokens.SALES)).send({ note: 'Note A' });
    await request(app).post(`/api/customers/${cid}/follow-ups`).set(...bearer(fx.tokens.SALES)).send({ note: 'Note B' });
    const list = await request(app).get(`/api/customers/${cid}/follow-ups`).set(...bearer(fx.tokens.ADMIN));
    const notes = (list.body.data as { note: string }[]).map((f) => f.note).sort();
    expect(notes).toEqual(['Note A', 'Note B']);
  });
});
