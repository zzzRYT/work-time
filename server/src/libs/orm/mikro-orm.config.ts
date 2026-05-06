import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import * as path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  driverOptions: process.env.DATABASE_URL?.includes('supabase')
    ? { connection: { ssl: { rejectUnauthorized: false } } }
    : {},
  entities: [path.join(__dirname, '../../features/**/*.orm-entity.{ts,js}')],
  entitiesTs: [path.join(__dirname, '../../features/**/*.orm-entity.ts')],
  debug: !isProduction,
  extensions: [Migrator],
  migrations: {
    path: path.join(__dirname, '../../../migrations'),
    pathTs: path.join(__dirname, '../../../migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: true,
    emit: 'ts',
  },
});
