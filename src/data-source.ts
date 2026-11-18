import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from './config/database.config';

const options = databaseConfig();

export default new DataSource({
  ...options,
  synchronize: false,
  migrationsRun: false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
