import { DataSource } from 'typeorm';
import { configuration } from './config/app.config';

const config = configuration();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.databaseHost,
  port: config.databasePort,
  username: config.databaseUsername,
  password: config.databasePassword,
  database: config.databaseName,
  synchronize: true,
});
