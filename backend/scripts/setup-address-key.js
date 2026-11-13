import { existsSync } from 'node:fs';
import { mkdir, open, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';
import { contactRepository } from '../src/repositories/contact.repository.js';
import { addressKeyId } from '../src/security/address-crypto.js';
import { readAddressKeyFile, writeAddressKeyFile } from '../src/security/address-key.js';

export async function prepareAddressKey(keyPath, storedKeyIds) {
  await mkdir(dirname(keyPath), { recursive: true });
  const lockPath = `${keyPath}.lock`;
  const lock = await open(lockPath, 'wx');
  let key;
  try {
    if (existsSync(keyPath)) key = readAddressKeyFile(keyPath);
    else {
      if (storedKeyIds.length)
        throw new Error(
          'Falta la clave de direcciones y existen datos cifrados. Recuperar la clave original; no se generó otra.',
        );
      key = randomBytes(32);
      writeAddressKeyFile(keyPath, key);
    }
    if (storedKeyIds.some((id) => id !== addressKeyId(key)))
      throw new Error(
        'La clave no corresponde a las direcciones guardadas. No se modificó la clave ni los datos.',
      );
  } finally {
    key?.fill(0);
    await lock.close();
    await unlink(lockPath);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  contactRepository
    .storedKeyIds()
    .then((ids) => prepareAddressKey(env.addressKeyFile, ids))
    .then(() => console.log('Clave de direcciones disponible y protegida con Windows DPAPI.'))
    .catch(() => {
      console.error(
        'No se pudo preparar la clave de direcciones. Conservar .local/address-key.xml; si falta y existen datos cifrados, recuperar la clave original con el mismo usuario de Windows.',
      );
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
