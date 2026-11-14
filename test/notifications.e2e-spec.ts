import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { DataSource } from 'typeorm';
import { Category } from '../src/categories/entities/category.entity';
import {
  createTestApp,
  registerUser,
  resetDatabase,
  type RegisteredUser,
} from './utils/test-app';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let port: number;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    await resetDatabase(app);
    await app.listen(0);
    port = (app.getHttpServer().address() as { port: number }).port;
  });

  afterAll(async () => {
    await app.close();
  });

  function connectSocket(token: string): Promise<Socket> {
    const socket = io(`http://localhost:${port}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });

    return new Promise<Socket>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Не удалось подключиться к websocket')),
        5000,
      );
      socket.on('connect', () => {
        clearTimeout(timer);
        resolve(socket);
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async function createSkillFor(
    user: RegisteredUser,
    title: string,
  ): Promise<number> {
    const category = await dataSource
      .getRepository(Category)
      .save({ name: `Категория ${title}`, parent: null });

    const res = await request(app.getHttpServer())
      .post('/skills')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ title, description: 'Description', categoryId: category.id })
      .expect(201);

    return res.body.id as number;
  }

  it('pushes a real-time notification to the receiver when a request is created', async () => {
    const sender = await registerUser(app);
    const receiver = await registerUser(app);

    const socket = await connectSocket(receiver.accessToken);
    const received = new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Уведомление не получено')),
        5000,
      );
      socket.on('notification', (data: Record<string, unknown>) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    const offeredSkillId = await createSkillFor(sender, 'React');
    const requestedSkillId = await createSkillFor(receiver, 'Backend');

    const createRes = await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ offeredSkillId, requestedSkillId })
      .expect(201);

    const notification = await received;

    expect(notification.requestId).toBe(createRes.body.id);
    expect(notification.type).toBe('requestReceived');
    expect(notification.isRead).toBe(false);

    socket.close();
  });

  it('lists the notifications of the current user via REST', async () => {
    const sender = await registerUser(app);
    const receiver = await registerUser(app);

    const offeredSkillId = await createSkillFor(sender, 'Vue');
    const requestedSkillId = await createSkillFor(receiver, 'Rust');

    await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ offeredSkillId, requestedSkillId })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('requestReceived');

    const markRead = await request(app.getHttpServer())
      .patch(`/notifications/${res.body[0].id}/read`)
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .expect(200);

    expect(markRead.body.isRead).toBe(true);
  });

  it('returns 401 when listing notifications without a token', async () => {
    await request(app.getHttpServer()).get('/notifications').expect(401);
  });
});
