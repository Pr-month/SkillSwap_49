import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

const envPath = resolve(process.cwd(), '.env.test.local');
const testEnv = parse(readFileSync(envPath));

const requiredKeys = [
  'NODE_ENV',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'DB_SYNCHRONIZE',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const key of requiredKeys) {
  if (!testEnv[key]?.trim()) {
    throw new Error(
      `В .env.test.local отсутствует обязательная переменная ${key}`,
    );
  }
}

if (testEnv.NODE_ENV !== 'test') {
  throw new Error('E2E-тесты разрешены только с NODE_ENV=test');
}

if (testEnv.DB_DATABASE !== 'skillswap_test') {
  throw new Error('E2E-тесты разрешены только для базы skillswap_test');
}

Object.assign(process.env, testEnv);

console.log(
  `E2E: целевая БД ${process.env.DB_DATABASE}, хост ${process.env.DB_HOST}:${process.env.DB_PORT}`,
);
