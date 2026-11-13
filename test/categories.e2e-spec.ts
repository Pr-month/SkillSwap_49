import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
  registerAdmin,
  registerUser,
} from './utils/test-app';

describe('Categories (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('returns an empty list initially', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('POST /categories', () => {
    it('returns 403 for a non-admin user', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'IT' })
        .expect(403);
    });

    it('creates a root category as admin', async () => {
      const admin = await registerAdmin(app);

      const res = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: '  IT и программирование  ' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('IT и программирование');
    });

    it('returns 400 for a too short name as admin', async () => {
      const admin = await registerAdmin(app);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'ab' })
        .expect(400);
    });

    it('returns 404 for a missing parent as admin', async () => {
      const admin = await registerAdmin(app);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Frontend', parentId: 99999 })
        .expect(404);
    });
  });

  describe('GET /categories (with data)', () => {
    it('returns root categories with nested children', async () => {
      const admin = await registerAdmin(app);
      const root = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Дизайн' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'UX/UI', parentId: root.body.id })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const design = res.body.find(
        (c: { name: string }) => c.name === 'Дизайн',
      );
      expect(design).toBeDefined();
      expect(design.children.map((c: { name: string }) => c.name)).toContain(
        'UX/UI',
      );
    });
  });

  describe('PATCH /categories/:id', () => {
    it('updates a category as admin', async () => {
      const admin = await registerAdmin(app);
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Старое имя' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Новое имя' })
        .expect(200);

      expect(res.body.name).toBe('Новое имя');
    });

    it('returns 403 for a non-admin user', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/categories/1')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'X' })
        .expect(403);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('deletes a category as admin', async () => {
      const admin = await registerAdmin(app);
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Удаляемая' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(res.body.message).toBeDefined();
      expect(res.body.deletedCategoryIds).toContain(created.body.id);
    });

    it('returns 403 for a non-admin user', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .delete('/categories/1')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(403);
    });

    it('returns 404 for a missing category as admin', async () => {
      const admin = await registerAdmin(app);

      await request(app.getHttpServer())
        .delete('/categories/99999')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(404);
    });
  });
});
