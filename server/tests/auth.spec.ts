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

describe('auth', () => {
  it('accepts valid credentials and returns a JWT + user', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: fx.users.ADMIN.email, password: fx.users.ADMIN.password });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(typeof r.body.data.token).toBe('string');
    expect(r.body.data.user.role).toBe('ADMIN');
    expect(r.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects an invalid password with 401 INVALID_CREDENTIALS', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: fx.users.ADMIN.email, password: 'nope' });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a malformed login payload with 400 VALIDATION_ERROR', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    expect(r.body.error.fieldErrors).toBeTruthy();
  });

  it('protects /api/auth/me — 401 without token, 200 with token', async () => {
    const noToken = await request(app).get('/api/auth/me');
    expect(noToken.status).toBe(401);
    const withToken = await request(app).get('/api/auth/me').set(...bearer(fx.tokens.SALES));
    expect(withToken.status).toBe(200);
    expect(withToken.body.data.email).toBe('sales@test.local');
    expect(withToken.body.data).not.toHaveProperty('passwordHash');
  });

  it('rejects an invalid token', async () => {
    const r = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage.token.value');
    expect(r.status).toBe(401);
  });
});
