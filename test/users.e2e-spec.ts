import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase, registerUser } from './utils/test-app';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('returns the current user without sensitive fields', async () => {
      const user = await registerUser(app, { email: 'me@test.com' });

      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(res.body.email).toBe('me@test.com');
      expect(res.body.password).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
    });

    it('returns 401 without an access token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('updates the current user profile', async () => {
      const user = await registerUser(app, { email: 'update@test.com' });

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Новое Имя', about: 'О себе' })
        .expect(200);

      expect(res.body.name).toBe('Новое Имя');
      expect(res.body.about).toBe('О себе');
    });

    it('returns 401 without an access token', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'X' })
        .expect(401);
    });
  });

  describe('PATCH /users/me/password', () => {
    it('changes the password', async () => {
      const user = await registerUser(app, { email: 'pass@test.com' });

      await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ currentPassword: 'Password123', newPassword: 'NewPassword123' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'pass@test.com', password: 'NewPassword123' })
        .expect(201);
    });

    it('returns 401 for a wrong current password', async () => {
      const user = await registerUser(app, { email: 'wrongpass@test.com' });

      await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ currentPassword: 'WrongPass', newPassword: 'NewPassword123' })
        .expect(401);
    });

    it('returns 400 when the new password equals the current one', async () => {
      const user = await registerUser(app, { email: 'samepass@test.com' });

      await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ currentPassword: 'Password123', newPassword: 'Password123' })
        .expect(400);
    });
  });

  describe('POST /users', () => {
    it('creates a user without exposing the password', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Прямое Создание',
          email: 'direct@test.com',
          password: 'Password123',
        })
        .expect(201);

      expect(res.body.email).toBe('direct@test.com');
      expect(res.body.password).toBeUndefined();
    });

    it('returns 400 for an invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: '', email: 'bad', password: 'short' })
        .expect(400);
    });
  });
});
