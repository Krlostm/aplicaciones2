import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createSecretKey,
  randomBytes,
} from 'node:crypto';
import { env } from '../config/env.js';
import { decodeAddressKey, readAddressKeyFile } from './address-key.js';

export function addressKeyId(key) {
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

export function createAddressCipher(rawKey) {
  if (!Buffer.isBuffer(rawKey) || rawKey.length !== 32)
    throw new Error('AES-256-GCM requiere una clave de 32 bytes.');
  const keyId = addressKeyId(rawKey);
  const key = createSecretKey(rawKey);
  const context = (userId) =>
    Buffer.from(`tutorias:user_contact_details:address:v1:${userId}`, 'utf8');
  return {
    keyId,
    encrypt(userId, address) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
      cipher.setAAD(context(userId));
      const ciphertext = Buffer.concat([cipher.update(address, 'utf8'), cipher.final()]);
      return { ciphertext, iv, authTag: cipher.getAuthTag(), keyId, version: 1 };
    },
    decrypt(userId, encrypted) {
      try {
        if (
          encrypted.version !== 1 ||
          encrypted.keyId !== keyId ||
          !Buffer.isBuffer(encrypted.iv) ||
          encrypted.iv.length !== 12 ||
          !Buffer.isBuffer(encrypted.authTag) ||
          encrypted.authTag.length !== 16 ||
          !Buffer.isBuffer(encrypted.ciphertext)
        )
          throw new Error('Formato no válido.');
        const decipher = createDecipheriv('aes-256-gcm', key, encrypted.iv, { authTagLength: 16 });
        decipher.setAAD(context(userId));
        decipher.setAuthTag(encrypted.authTag);
        // No entregar ningún texto hasta que final() compruebe la autenticidad.
        return Buffer.concat([decipher.update(encrypted.ciphertext), decipher.final()]).toString(
          'utf8',
        );
      } catch {
        throw new Error('No se pudo verificar la dirección cifrada.');
      }
    },
  };
}

let cipher;
export function getAddressCipher() {
  if (!cipher) {
    const rawKey =
      process.env.NODE_ENV === 'test' && process.env.ADDRESS_ENCRYPTION_TEST_KEY
        ? decodeAddressKey(process.env.ADDRESS_ENCRYPTION_TEST_KEY)
        : readAddressKeyFile(env.addressKeyFile);
    cipher = createAddressCipher(rawKey);
    rawKey.fill(0);
  }
  return cipher;
}
