import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

const getConnectionString = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }
  return databaseUrl;
};

export const getPool = (): Pool => {
  if (!_pool) {
    _pool = new Pool({
      connectionString: getConnectionString(),
    });
  }
  return _pool;
};

export const getDb = (): NodePgDatabase => {
  if (!_db) {
    _db = drizzle({ client: getPool() });
  }
  return _db;
};

// Lazy singletons untuk backward compatibility: tidak membuat koneksi saat import,
// tapi akan menginisialisasi saat pertama kali diakses.
export const pool = new Proxy({} as Pool, {
  get: (_, prop) => {
    const p = getPool();
    const value = (p as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(p) : value;
  },
}) as Pool;

export const db = new Proxy({} as NodePgDatabase, {
  get: (_, prop) => {
    const d = getDb();
    const value = (d as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(d) : value;
  },
}) as NodePgDatabase;
