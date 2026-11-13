import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { Request } from '../src/requests/entities/request.entity';
import { RequestStatus } from '../src/requests/request.enums';
import {
  createTestApp,
  resetDatabase,
  registerUser,
  registerAdmin,
  type RegisteredUser,
} from './utils/test-app';

describe('Requests (e2e)', () => {
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

  async function createRequest(
    sender: RegisteredUser,
    receiver: RegisteredUser,
  ): Promise<number> {
    const userRepo = dataSource.getRepository(User);
    const skillRepo = dataSource.getRepository(Skill);

    const senderEntity = await userRepo.findOneByOrFail({ id: sender.id });
    const receiverEntity = await userRepo.findOneByOrFail({ id: receiver.id });

    const category = await dataSource
      .getRepository(Category)
      .save({ name: 'IT и программирование', parent: null });

    const offeredSkill = await skillRepo.save({
      title: 'React',
      description: 'Frontend',
      images: [],
      owner: senderEntity,
      category,
    });
    const requestedSkill = await skillRepo.save({
      title: 'Backend',
      description: 'Node.js',
      images: [],
      owner: receiverEntity,
      category,
    });

    const request = await dataSource.getRepository(Request).save({
      sender: senderEntity,
      receiver: receiverEntity,
      offeredSkill,
      requestedSkill,
      status: RequestStatus.PENDING,
    });

    return request.id;
  }

  describe('GET /requests/incoming', () => {
    it('returns incoming requests for the current user', async () => {
      const sender = await registerUser(app);
      const receiver = await registerUser(app);
      const requestId = await createRequest(sender, receiver);

      const res = await request(app.getHttpServer())
        .get('/requests/incoming')
        .set('Authorization', `Bearer ${receiver.accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(requestId);
      expect(res.body[0].sender.id).toBe(sender.id);
    });

    it('returns 401 without an access token', async () => {
      await request(app.getHttpServer()).get('/requests/incoming').expect(401);
    });
  });

  describe('DELETE /requests/:id', () => {
    it('allows the sender to delete the request', async () => {
      const sender = await registerUser(app);
      const receiver = await registerUser(app);
      const requestId = await createRequest(sender, receiver);

      await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .expect(200);
    });

    it('allows an admin to delete the request', async () => {
      const sender = await registerUser(app);
      const receiver = await registerUser(app);
      const admin = await registerAdmin(app);
      const requestId = await createRequest(sender, receiver);

      await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);
    });

    it('returns 403 for a non-owner non-admin user', async () => {
      const sender = await registerUser(app);
      const receiver = await registerUser(app);
      const stranger = await registerUser(app);
      const requestId = await createRequest(sender, receiver);

      await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .expect(403);
    });

    it('returns 404 for a missing request', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .delete('/requests/99999')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);
    });
  });
});
