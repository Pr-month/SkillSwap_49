import { ConfigType, registerAs } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ||
    '1h') as JwtExpiresIn,
  refreshTokenExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ||
    '7d') as JwtExpiresIn,
}));

export type TJwtConfig = ConfigType<typeof jwtConfig>;
