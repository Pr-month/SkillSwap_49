import type { DataSource } from 'typeorm';

const EXPECTED_DATABASE = 'skillswap_test';

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function resetTestDb(dataSource: DataSource): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Очистка БД разрешена только при NODE_ENV=test');
  }

  const result: Array<{ database: string }> = await dataSource.query(
    'SELECT current_database() AS database',
  );

  const database = result[0]?.database;

  if (database !== EXPECTED_DATABASE) {
    throw new Error(
      `Очистка запрещена: ожидается ${EXPECTED_DATABASE}, подключена ${database}`,
    );
  }

  const tables = await dataSource.query<
    Array<{ schemaname: string; tablename: string }>
  >(
    `
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname = $1
        AND tablename NOT IN ($2, $3)
      ORDER BY tablename
    `,
    ['public', 'migrations', 'typeorm_metadata'],
  );

  if (tables.length === 0) {
    return;
  }

  const tableNames = tables
    .map(
      ({ schemaname, tablename }) =>
        `${quoteIdentifier(schemaname)}.${quoteIdentifier(tablename)}`,
    )
    .join(', ');

  await dataSource.query(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY RESTRICT`,
  );
}
