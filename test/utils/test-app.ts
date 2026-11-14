import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AllExceptionFilter } from '../../src/common/filters/all-exception.filter';
import { User } from '../../src/users/entities/user.entity';
import { UserRole } from '../../src/users/users.enums';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
    }),
  );

  await app.init();

  return app;
}

const TABLES = [
  'notifications',
  'skill_favorites',
  'requests',
  'skills',
  'categories',
  'user_want_to_learn',
  'users',
];

export async function resetDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  await dataSource.query(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
}

let counter = 0;

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
  id: number;
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(
  app: INestApplication,
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<RegisteredUser> {
  const name = overrides.name ?? 'Тестовый Пользователь';
  const email =
    overrides.email ?? `user-${Date.now()}-${counter++}@example.com`;
  const password = overrides.password ?? 'Password123';

  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ name, email, password })
    .expect(201);

  return {
    name,
    email,
    password,
    id: res.body.user.id,
    accessToken: res.body.tokens.accessToken,
    refreshToken: res.body.tokens.refreshToken,
  };
}

export async function registerAdmin(
  app: INestApplication,
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<RegisteredUser> {
  const user = await registerUser(app, overrides);
  const dataSource = app.get(DataSource);

  await dataSource
    .getRepository(User)
    .update(user.id, { role: UserRole.ADMIN });

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: user.password })
    .expect(201);

  return {
    ...user,
    accessToken: login.body.tokens.accessToken,
    refreshToken: login.body.tokens.refreshToken,
  };
}
