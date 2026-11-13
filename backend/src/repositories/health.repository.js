import { pool } from '../db/pool.js';
export async function checkDatabase() {
  const { rows } = await pool.query('SELECT 1 AS connected');
  return rows[0].connected === 1;
}
