import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Category } from '../src/categories/entities/category.entity';
import { createTestApp, resetDatabase, registerUser } from './utils/test-app';

describe('Skills (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createCategory(): Promise<number> {
    const category = await dataSource
      .getRepository(Category)
      .save({ name: 'IT и программирование', parent: null });
    return category.id;
  }

  describe('POST /skills', () => {
    it('creates a skill for the authenticated user', async () => {
      const user = await registerUser(app);
      const categoryId = await createCategory();

      const res = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          title: '  React  ',
          description: '  Frontend framework  ',
          categoryId,
          images: ['a.png'],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('React');
      expect(res.body.description).toBe('Frontend framework');
    });

    it('returns 401 without an access token', async () => {
      await request(app.getHttpServer())
        .post('/skills')
        .send({ title: 'React', description: 'Desc', categoryId: 1 })
        .expect(401);
    });

    it('returns 404 for a missing category', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'React', description: 'Desc', categoryId: 99999 })
        .expect(404);
    });

    it('returns 400 for an empty title', async () => {
      const user = await registerUser(app);
      const categoryId = await createCategory();

      await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: '   ', description: 'Desc', categoryId })
        .expect(400);
    });
  });

  describe('PATCH /skills/:id', () => {
    it('updates the owner skill', async () => {
      const owner = await registerUser(app);
      const categoryId = await createCategory();
      const created = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'React',
          description: 'Desc',
          categoryId,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/skills/${created.body.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'React Advanced' })
        .expect(200);

      expect(res.body.title).toBe('React Advanced');
    });

    it('returns 403 for a non-owner user', async () => {
      const owner = await registerUser(app);
      const other = await registerUser(app);
      const categoryId = await createCategory();
      const created = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'React', description: 'Desc', categoryId })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/skills/${created.body.id}`)
        .set('Authorization', `Bearer ${other.accessToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /skills/:id', () => {
    it('deletes the owner skill', async () => {
      const owner = await registerUser(app);
      const categoryId = await createCategory();
      const created = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'React', description: 'Desc', categoryId })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/skills/${created.body.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
    });

    it('returns 403 for a non-owner user', async () => {
      const owner = await registerUser(app);
      const other = await registerUser(app);
      const categoryId = await createCategory();
      const created = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'React', description: 'Desc', categoryId })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/skills/${created.body.id}`)
        .set('Authorization', `Bearer ${other.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /skills', () => {
    it('returns the stub response', async () => {
      const res = await request(app.getHttpServer()).get('/skills').expect(200);
      expect(res.text).toBe('This action returns all skills');
    });
  });
});
