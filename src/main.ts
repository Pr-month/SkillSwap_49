import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';

import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { appConfig, type TAppConfig } from './config/app.config';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Ранняя проверка окружения: приложение не стартует с невалидными настройками.
  const env = validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  // За прокси используем реальный IP клиента (для корректного rate limiting).
  if (env.trustProxy) {
    const express = app.getHttpAdapter().getInstance();
    express.set('trust proxy', true);
  }

  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidUnknownValues: true,
    }),
  );

  const config = app.get<TAppConfig>(appConfig.KEY);

  app.useStaticAssets(join(process.cwd(), 'public'));

  await app.listen(config.port);
}

void bootstrap();
