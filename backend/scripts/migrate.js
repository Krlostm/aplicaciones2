import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';
export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(7453001)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const path = fileURLToPath(new URL('../migrations/', import.meta.url));
    for (const name of (await readdir(path)).filter((n) => n.endsWith('.sql')).sort()) {
      const sql = await readFile(`${path}/${name}`, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const { rows } = await client.query(
        'SELECT checksum FROM schema_migrations WHERE name = $1',
        [name],
      );
      if (rows.length) {
        if (rows[0].checksum !== checksum)
          throw new Error(`La migración aplicada ${name} fue modificada. Crear otra migración.`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)', [
          name,
          checksum,
        ]);
        await client.query('COMMIT');
        console.log(`Migración aplicada: ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(7453001)');
    client.release();
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate()
    .then(() => console.log('Migraciones verificadas.'))
    .catch(() => {
      console.error('Error en migraciones; revisar conexión y archivos SQL.');
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
