import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { throttleConfig, type TThrottleConfig } from './config/throttle.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { databaseConfig } from './config/database.config';
import { type DataSourceOptions } from 'typeorm';
import { SkillsModule } from './skills/skills.module';
import { CategoriesModule } from './categories/categories.module';
import { FilesModule } from './files/files.module';
import { RequestsModule } from './requests/requests.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, throttleConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: DataSourceOptions) => ({
        ...config,
        autoLoadEntities: true,
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [throttleConfig.KEY],
      useFactory: (config: TThrottleConfig) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.ttl,
            limit: config.limit,
          },
        ],
      }),
    }),
    UsersModule,
    AuthModule,
    SkillsModule,
    CategoriesModule,
    FilesModule,
    RequestsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
