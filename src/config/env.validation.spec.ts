import { validateEnv } from './env.validation';

function baseEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    PORT: '3000',
    HASH_SALT: '10',
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_DATABASE: 'skillswap',
    DB_SYNCHRONIZE: 'true',
    DB_LOGGING: 'false',
    TRUST_PROXY: 'false',
    THROTTLE_TTL: '60',
    THROTTLE_LIMIT: '100',
    AUTH_THROTTLE_TTL: '60',
    AUTH_THROTTLE_LIMIT: '5',
  };
}

describe('validateEnv', () => {
  it('returns parsed values for a valid environment', () => {
    const env = validateEnv(baseEnv());

    expect(env.port).toBe(3000);
    expect(env.hashSalt).toBe(10);
    expect(env.jwtAccessSecret).toBe('test-access-secret');
    expect(env.dbPort).toBe(5432);
    expect(env.dbSynchronize).toBe(true);
    expect(env.throttleLimit).toBe(100);
    expect(env.authThrottleLimit).toBe(5);
  });

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    const env = baseEnv();
    delete env.JWT_ACCESS_SECRET;

    expect(() => validateEnv(env)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('throws when a JWT secret is a placeholder value', () => {
    const env = baseEnv();
    env.JWT_ACCESS_SECRET = 'secret';

    expect(() => validateEnv(env)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('throws when PORT is not a valid integer', () => {
    const env = baseEnv();
    env.PORT = 'abc';

    expect(() => validateEnv(env)).toThrow(/PORT/);
  });

  it('throws when DB_PORT is out of range', () => {
    const env = baseEnv();
    env.DB_PORT = '99999';

    expect(() => validateEnv(env)).toThrow(/DB_PORT/);
  });

  describe('production', () => {
    const prodEnv = (): NodeJS.ProcessEnv => ({
      ...baseEnv(),
      NODE_ENV: 'production',
      DB_SYNCHRONIZE: 'false',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
    });

    it('throws when DB_SYNCHRONIZE=true', () => {
      const env = prodEnv();
      env.DB_SYNCHRONIZE = 'true';

      expect(() => validateEnv(env)).toThrow(/DB_SYNCHRONIZE/);
    });

    it('throws when JWT secrets are shorter than 32 characters', () => {
      const env = prodEnv();
      env.JWT_ACCESS_SECRET = 'short';

      expect(() => validateEnv(env)).toThrow(/32/);
    });

    it('throws when JWT secrets are equal', () => {
      const env = prodEnv();
      env.JWT_REFRESH_SECRET = env.JWT_ACCESS_SECRET;

      expect(() => validateEnv(env)).toThrow(/различаться/);
    });

    it('throws when DB connection parameters are missing', () => {
      const env = prodEnv();
      delete env.DB_HOST;
      delete env.DB_USERNAME;
      delete env.DB_PASSWORD;
      delete env.DB_DATABASE;

      expect(() => validateEnv(env)).toThrow(/DB_/);
    });

    it('accepts a valid production environment', () => {
      expect(() => validateEnv(prodEnv())).not.toThrow();
    });
  });
});
