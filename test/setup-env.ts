// Environment for E2E tests. Runs before every test file.
// In CI, DATABASE_URL is provided and takes precedence in database.config.ts.
process.env.NODE_ENV = 'test';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'skillswap_test';
process.env.DB_SYNCHRONIZE = 'true';
process.env.DB_LOGGING = 'false';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.HASH_SALT = process.env.HASH_SALT || '4';

// Высокие лимиты, чтобы rate limiting не мешал остальным e2e-тестам.
process.env.THROTTLE_TTL = process.env.THROTTLE_TTL || '60';
process.env.THROTTLE_LIMIT = process.env.THROTTLE_LIMIT || '1000';
process.env.AUTH_THROTTLE_TTL = process.env.AUTH_THROTTLE_TTL || '60';
process.env.AUTH_THROTTLE_LIMIT = process.env.AUTH_THROTTLE_LIMIT || '1000';
