import { app, sessionStore } from './app.js';
import { pool } from './db/pool.js';
import { env } from './config/env.js';
import { getHealth } from './services/health.service.js';
import { getAddressCipher } from './security/address-crypto.js';
getAddressCipher();
await getHealth();
const server = app.listen(env.port, env.host, () =>
  console.log(`API Tutorías: http://${env.host}:${env.port}/api/health | PostgreSQL conectado`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(async () => {
      sessionStore.close();
      await pool.end();
      process.exit(0);
    }),
  );
