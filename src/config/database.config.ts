import { registerAs } from '@nestjs/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { validateEnv } from './env.validation';

export const databaseConfig = registerAs('DB_CONFIG', (): DataSourceOptions => {
  const env = validateEnv();

  const base: DataSourceOptions = {
    type: 'postgres',
    synchronize: env.dbSynchronize,
    logging: env.dbLogging,
    migrations: ['dist/migrations/*.js'],
    // Схема управляется миграциями, а не synchronize. При DB_SYNCHRONIZE=true
    // (разработка/тесты) миграции на старте не выполняются.
    migrationsRun: !env.dbSynchronize,
  };

  if (env.databaseUrl) {
    return {
      ...base,
      url: env.databaseUrl,
    };
  }

  return {
    ...base,
    host: env.dbHost,
    port: env.dbPort,
    username: env.dbUsername,
    password: env.dbPassword,
    database: env.dbDatabase,
  };
});

/**
 * Автономный DataSource для скриптов (сидинг) и CLI TypeORM.
 * Миграции здесь не выполняются автоматически: для них используйте
 * `src/data-source.ts` и команды npm run migration:*.
 */
export const AppDataSource = new DataSource({
  ...databaseConfig(),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: false,
  logging: false,
});
