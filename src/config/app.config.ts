import { registerAs, type ConfigType } from '@nestjs/config';

export const configuration = registerAs('APP_CONFIG', () => ({
  port: Number(process.env.PORT) || 3000,
  databaseHost: process.env.DB_HOST || 'localhost',
  databasePort: Number(process.env.DB_PORT) || 5432,
  databaseUsername: process.env.DB_USERNAME || 'postgres',
  databasePassword: process.env.DB_PASSWORD || 'postgres',
  databaseName: process.env.DB_DATABASE || 'skillswap',
  databaseSynchronize: process.env.DB_SYNCHRONIZE === 'true',
  databaseLogging: process.env.DB_LOGGING === 'true',
}));

export type TConfig = ConfigType<typeof configuration>;
