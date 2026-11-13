import pg from 'pg';
import { env } from '../config/env.js';
export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});
pool.on('error', () => console.error('Se perdió una conexión PostgreSQL del pool.'));
