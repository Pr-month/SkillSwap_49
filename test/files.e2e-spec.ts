import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { basename, join } from 'path';
import { createTestApp } from './utils/test-app';

describe('Files (e2e)', () => {
  let app: INestApplication;

  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  const createdFiles: string[] = [];

  beforeAll(async () => {
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    app = await createTestApp();
  });

  afterAll(async () => {
    for (const file of createdFiles) {
      const filePath = join(uploadsDir, file);
      if (existsSync(filePath)) {
        rmSync(filePath);
      }
    }

    await app.close();
  });

  function trackFile(url: string): void {
    createdFiles.push(basename(url));
  }

  describe('POST /files', () => {
    it('uploads a png image', async () => {
      const res = await request(app.getHttpServer())
        .post('/files')
        .attach('file', join(__dirname, 'fixtures', 'valid.png'))
        .expect(201);

      expect(res.body.url).toMatch(/^\/uploads\/.+\.png$/);
      trackFile(res.body.url);
    });

    it('uploads a jpeg image', async () => {
      const res = await request(app.getHttpServer())
        .post('/files')
        .attach('file', join(__dirname, 'fixtures', 'image.jpg'))
        .expect(201);

      expect(res.body.url).toMatch(/^\/uploads\/.+\.jpg$/);
      trackFile(res.body.url);
    });

    it('uploads a webp image', async () => {
      const res = await request(app.getHttpServer())
        .post('/files')
        .attach('file', join(__dirname, 'fixtures', 'image.webp'))
        .expect(201);

      expect(res.body.url).toMatch(/^\/uploads\/.+\.webp$/);
      trackFile(res.body.url);
    });

    it('rejects a non-image file with 400', async () => {
      await request(app.getHttpServer())
        .post('/files')
        .attach('file', join(__dirname, 'fixtures', 'invalid.txt'))
        .expect(400);
    });

    it('rejects a file larger than the limit with 413', async () => {
      await request(app.getHttpServer())
        .post('/files')
        .attach('file', join(__dirname, 'fixtures', 'large.png'))
        .expect(413);
    });
  });
});
