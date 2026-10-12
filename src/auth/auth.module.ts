import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { jwtConfig, type TJwtConfig } from '../config/jwt.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: TJwtConfig): JwtModuleOptions => {
        if (!config.accessTokenSecret) {
          throw new Error('JWT_ACCESS_SECRET не обнаружен');
        }

        return {
          secret: config.accessTokenSecret,
          signOptions: {
            expiresIn: config.accessTokenExpiresIn as JwtExpiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
