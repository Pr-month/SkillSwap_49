import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';

describe('Rate limiting (e2e)', () => {
  afterEach(() => {
    delete process.env.AUTH_THROTTLE_LIMIT;
    delete process.env.AUTH_THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;
    delete process.env.THROTTLE_TTL;
  });

  it('returns 429 after exceeding the auth rate limit', async () => {
    process.env.AUTH_THROTTLE_LIMIT = '3';
    process.env.AUTH_THROTTLE_TTL = '60';

    const app: INestApplication = await createTestApp();

    try {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: `user${i}@example.com`, password: 'Password123' })
          .expect(401);
      }

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'blocked@example.com', password: 'Password123' })
        .expect(429);

      expect(res.body.statusCode).toBe(429);
      expect(res.body.error).toBe('Too Many Requests');
    } finally {
      await app.close();
    }
  });

  it('returns 429 after exceeding the general rate limit', async () => {
    process.env.THROTTLE_LIMIT = '3';
    process.env.THROTTLE_TTL = '60';

    const app: INestApplication = await createTestApp();

    try {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer()).get('/').expect(200);
      }

      await request(app.getHttpServer()).get('/').expect(429);
    } finally {
      await app.close();
    }
  });
});
