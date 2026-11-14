import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase, registerUser } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('registers a user and returns tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Анна', email: 'anna@test.com', password: 'Password123' })
        .expect(201);

      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('anna@test.com');
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.refreshToken).toBeUndefined();
    });

    it('returns 409 for a duplicate email', async () => {
      const payload = {
        name: 'Иван',
        email: 'dup@test.com',
        password: 'Password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(201);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(409);
    });

    it.each([
      { name: '', email: 'a@test.com', password: 'Password123' },
      { name: 'A', email: 'a@test.com', password: 'Password123' },
      { name: 'Анна', email: 'not-an-email', password: 'Password123' },
      { name: 'Анна', email: 'a@test.com', password: 'short' },
    ])('returns 400 for an invalid payload: %j', async (body) => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(body)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      await registerUser(app, { email: 'login@test.com' });
    });

    it('returns tokens for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'Password123' })
        .expect(201);

      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('login@test.com');
    });

    it('returns 401 for a wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'WrongPass123' })
        .expect(401);
    });

    it('returns 401 for an unknown email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'Password123' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new tokens for a valid refresh token', async () => {
      const user = await registerUser(app, { email: 'refresh@test.com' });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
    });

    it('returns 401 for an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the refresh token and returns 201', async () => {
      const user = await registerUser(app, { email: 'logout@test.com' });

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(201);
    });

    it('returns 401 without an access token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });
});
