import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConfig, type TJwtConfig } from '../config/jwt.config';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: TJwtConfig) => ({
        secret: config.accessTokenSecret,
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
