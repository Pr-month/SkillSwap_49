import { registerAs, type ConfigType } from '@nestjs/config';
export const configuration = registerAs('APP_CONFIG', () => ({
  port: Number(process.env.PORT) || 3000,
  databaseHost: process.env.DATABASE_HOST || 'localhost',
  databasePort: Number(process.env.DATABASE_PORT) || 5432,
  databaseUsername: process.env.DATABASE_USERNAME || 'postgres',
  databasePassword: process.env.DATABASE_PASSWORD || 'postgres',
  databaseName: process.env.DATABASE_NAME || 'skillswap',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
}));

export type TConfig = ConfigType<typeof configuration>;
