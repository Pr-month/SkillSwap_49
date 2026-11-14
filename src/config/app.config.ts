import { registerAs, ConfigType } from '@nestjs/config';
import { validateEnv } from './env.validation';

export const appConfig = registerAs('APP_CONFIG', () => {
  const env = validateEnv();

  return {
    nodeEnv: env.nodeEnv,
    port: env.port,
    hashSalt: env.hashSalt,
    trustProxy: env.trustProxy,
  };
});

export type TAppConfig = ConfigType<typeof appConfig>;
