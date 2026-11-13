import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
for (const key of ['DATABASE_URL', 'SESSION_SECRET']) {
  if (!process.env[key])
    throw new Error(`Falta ${key}; ejecutar npm run db:setup y revisar backend/.env.`);
}
if (process.env.SESSION_SECRET.length < 32)
  throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
export const env = {
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  addressKeyFile: process.env.ADDRESS_KEY_FILE
    ? resolve(fileURLToPath(new URL('../../', import.meta.url)), process.env.ADDRESS_KEY_FILE)
    : fileURLToPath(new URL('../../../.local/address-key.xml', import.meta.url)),
  production: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '127.0.0.1',
  origin: process.env.APP_ORIGIN || 'http://127.0.0.1:5173',
};
