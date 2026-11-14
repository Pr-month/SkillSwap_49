export type NodeEnv = 'development' | 'test' | 'production';

const VALID_NODE_ENVS: readonly string[] = [
  'development',
  'test',
  'production',
];

const PLACEHOLDER_SECRETS = new Set([
  'secret',
  'secret-key',
  'jwt-secret',
  'jwt_secret',
  'changeme',
  'change-me',
  'change_me',
  'password',
  'your-secret',
  'your_secret',
  'super-secret',
  'super_secret',
]);

export interface ValidatedEnv {
  nodeEnv: NodeEnv;
  port: number;
  hashSalt: number;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  databaseUrl?: string;
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword: string;
  dbDatabase: string;
  dbSynchronize: boolean;
  dbLogging: boolean;
  trustProxy: boolean;
  throttleTtlSeconds: number;
  throttleLimit: number;
  authThrottleTtlSeconds: number;
  authThrottleLimit: number;
}

function parseInteger(
  value: string | undefined,
  name: string,
  problems: string[],
  options: { min?: number; max?: number } = {},
): number {
  if (value === undefined || value.trim() === '') {
    problems.push(`${name} не задано`);
    return NaN;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    problems.push(`${name} должно быть целым числом, получено "${value}"`);
    return NaN;
  }

  if (options.min !== undefined && parsed < options.min) {
    problems.push(`${name} должно быть >= ${options.min}, получено ${parsed}`);
    return NaN;
  }

  if (options.max !== undefined && parsed > options.max) {
    problems.push(`${name} должно быть <= ${options.max}, получено ${parsed}`);
    return NaN;
  }

  return parsed;
}

function parseBooleanFlag(
  value: string | undefined,
  name: string,
  problems: string[],
): boolean {
  if (value === undefined || value.trim() === '') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  problems.push(`${name} должно быть "true" или "false", получено "${value}"`);
  return false;
}

function validateJwtSecret(
  value: string | undefined,
  name: string,
  problems: string[],
): string {
  if (value === undefined || value.trim() === '') {
    problems.push(`${name} не задано`);
    return '';
  }

  const secret = value.trim();

  if (PLACEHOLDER_SECRETS.has(secret.toLowerCase())) {
    problems.push(
      `${name} содержит значение-заглушку ("${value}"). Задайте настоящий секрет`,
    );
  }

  return secret;
}

export function validateEnv(
  env: NodeJS.ProcessEnv = process.env,
): ValidatedEnv {
  const problems: string[] = [];

  const rawNodeEnv = env.NODE_ENV ?? 'development';
  const nodeEnv = (
    VALID_NODE_ENVS.includes(rawNodeEnv) ? rawNodeEnv : 'development'
  ) as NodeEnv;

  if (!VALID_NODE_ENVS.includes(rawNodeEnv)) {
    problems.push(
      `NODE_ENV должно быть одним из ${VALID_NODE_ENVS.join(', ')}, получено "${rawNodeEnv}"`,
    );
  }

  const isProduction = nodeEnv === 'production';

  const port = parseInteger(env.PORT ?? '3000', 'PORT', problems, {
    min: 1,
    max: 65535,
  });
  const hashSalt = parseInteger(env.HASH_SALT ?? '10', 'HASH_SALT', problems, {
    min: 1,
    max: 31,
  });

  const jwtAccessSecret = validateJwtSecret(
    env.JWT_ACCESS_SECRET,
    'JWT_ACCESS_SECRET',
    problems,
  );
  const jwtRefreshSecret = validateJwtSecret(
    env.JWT_REFRESH_SECRET,
    'JWT_REFRESH_SECRET',
    problems,
  );

  if (isProduction) {
    if (jwtAccessSecret.length > 0 && jwtAccessSecret.length < 32) {
      problems.push(
        'JWT_ACCESS_SECRET в production должен быть длиной не менее 32 символов',
      );
    }
    if (jwtRefreshSecret.length > 0 && jwtRefreshSecret.length < 32) {
      problems.push(
        'JWT_REFRESH_SECRET в production должен быть длиной не менее 32 символов',
      );
    }
    if (jwtAccessSecret.length > 0 && jwtAccessSecret === jwtRefreshSecret) {
      problems.push(
        'JWT_ACCESS_SECRET и JWT_REFRESH_SECRET должны различаться',
      );
    }
  }

  const jwtAccessExpiresIn = (env.JWT_ACCESS_EXPIRES_IN ?? '1h').trim();
  const jwtRefreshExpiresIn = (env.JWT_REFRESH_EXPIRES_IN ?? '7d').trim();

  const databaseUrl = env.DATABASE_URL?.trim() || undefined;
  const dbHost = (env.DB_HOST ?? 'localhost').trim();
  const dbPort = parseInteger(env.DB_PORT ?? '5432', 'DB_PORT', problems, {
    min: 1,
    max: 65535,
  });
  const dbUsername = (env.DB_USERNAME ?? 'postgres').trim();
  const dbPassword = env.DB_PASSWORD ?? 'postgres';
  const dbDatabase = (env.DB_DATABASE ?? 'skillswap').trim();

  if (!databaseUrl && isProduction) {
    if (!env.DB_HOST) {
      problems.push('DB_HOST не задано (или задайте DATABASE_URL)');
    }
    if (!env.DB_USERNAME) {
      problems.push('DB_USERNAME не задано (или задайте DATABASE_URL)');
    }
    if (!env.DB_DATABASE) {
      problems.push('DB_DATABASE не задано (или задайте DATABASE_URL)');
    }
    if (env.DB_PASSWORD === undefined || env.DB_PASSWORD === '') {
      problems.push('DB_PASSWORD не задано (или задайте DATABASE_URL)');
    }
  }

  const dbSynchronize = parseBooleanFlag(
    env.DB_SYNCHRONIZE,
    'DB_SYNCHRONIZE',
    problems,
  );
  const dbLogging = parseBooleanFlag(env.DB_LOGGING, 'DB_LOGGING', problems);
  const trustProxy = parseBooleanFlag(env.TRUST_PROXY, 'TRUST_PROXY', problems);

  if (isProduction && dbSynchronize) {
    problems.push(
      'DB_SYNCHRONIZE=true запрещён в production. Используйте миграции (DB_SYNCHRONIZE=false)',
    );
  }

  const throttleTtlSeconds = parseInteger(
    env.THROTTLE_TTL ?? '60',
    'THROTTLE_TTL',
    problems,
    { min: 1 },
  );
  const throttleLimit = parseInteger(
    env.THROTTLE_LIMIT ?? '100',
    'THROTTLE_LIMIT',
    problems,
    { min: 1 },
  );
  const authThrottleTtlSeconds = parseInteger(
    env.AUTH_THROTTLE_TTL ?? '60',
    'AUTH_THROTTLE_TTL',
    problems,
    { min: 1 },
  );
  const authThrottleLimit = parseInteger(
    env.AUTH_THROTTLE_LIMIT ?? '5',
    'AUTH_THROTTLE_LIMIT',
    problems,
    { min: 1 },
  );

  if (problems.length > 0) {
    throw new Error(
      `Некорректная конфигурация окружения:\n- ${problems.join('\n- ')}`,
    );
  }

  return {
    nodeEnv,
    port,
    hashSalt,
    jwtAccessSecret,
    jwtRefreshSecret,
    jwtAccessExpiresIn,
    jwtRefreshExpiresIn,
    databaseUrl,
    dbHost,
    dbPort,
    dbUsername,
    dbPassword,
    dbDatabase,
    dbSynchronize,
    dbLogging,
    trustProxy,
    throttleTtlSeconds,
    throttleLimit,
    authThrottleTtlSeconds,
    authThrottleLimit,
  };
}
