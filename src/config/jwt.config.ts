import { ConfigType, registerAs } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';
import { validateEnv } from './env.validation';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

export const jwtConfig = registerAs('JWT_CONFIG', () => {
  const env = validateEnv();

  return {
    accessTokenSecret: env.jwtAccessSecret,
    refreshTokenSecret: env.jwtRefreshSecret,
    accessTokenExpiresIn: env.jwtAccessExpiresIn as JwtExpiresIn,
    refreshTokenExpiresIn: env.jwtRefreshExpiresIn as JwtExpiresIn,
  };
});

export type TJwtConfig = ConfigType<typeof jwtConfig>;
