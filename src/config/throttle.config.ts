import { registerAs, ConfigType } from '@nestjs/config';
import { validateEnv } from './env.validation';

export const throttleConfig = registerAs('THROTTLE_CONFIG', () => {
  const env = validateEnv();

  return {
    // ttl задаётся в миллисекундах (ожидание @nestjs/throttler v6)
    ttl: env.throttleTtlSeconds * 1000,
    limit: env.throttleLimit,
    authTtl: env.authThrottleTtlSeconds * 1000,
    authLimit: env.authThrottleLimit,
  };
});

export type TThrottleConfig = ConfigType<typeof throttleConfig>;
