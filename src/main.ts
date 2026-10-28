import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';

import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/filters/all-exception.filter'; // ← NEW
import { appConfig, type TAppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionFilter()); // ← NEW
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
