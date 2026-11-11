import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { DataSource } from 'typeorm';
import { resetTestDb } from './helpers/reset-test-db';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await resetTestDb(app.get(DataSource));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('подключается к тестовой базе skillswap_test', async () => {
    const dataSource = app.get(DataSource);

    const result: Array<{ database: string }> = await dataSource.query(
      'SELECT current_database() AS database',
    );

    console.log('Фактическая БД E2E:', result[0].database);

    expect(result[0].database).toBe('skillswap_test');
  });
  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
