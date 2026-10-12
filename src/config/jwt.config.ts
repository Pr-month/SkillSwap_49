import { ConfigType, registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export type TJwtConfig = ConfigType<typeof jwtConfig>;
