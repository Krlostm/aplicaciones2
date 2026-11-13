import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, unlink, rmdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createAddressCipher } from '../src/security/address-crypto.js';
import { decodeAddressKey, readAddressKeyFile } from '../src/security/address-key.js';
import { prepareAddressKey } from '../scripts/setup-address-key.js';

const userId = randomUUID();
const address = 'Calle de prueba 123, Edificio Ñandú';
const cipher = createAddressCipher(randomBytes(32));

test('AES-256-GCM recupera texto Unicode y no persiste texto legible', () => {
  const encrypted = cipher.encrypt(userId, address);
  assert.equal(cipher.decrypt(userId, encrypted), address);
  assert.equal(encrypted.ciphertext.includes(Buffer.from(address)), false);
  assert.equal(encrypted.iv.length, 12);
  assert.equal(encrypted.authTag.length, 16);
});

test('Cada cifrado de la misma dirección utiliza un IV distinto', () => {
  const first = cipher.encrypt(userId, address);
  const second = cipher.encrypt(userId, address);
  assert.ok(!first.iv.equals(second.iv));
  assert.ok(!first.ciphertext.equals(second.ciphertext));
  assert.equal(cipher.decrypt(userId, second), address);
});

test('GCM rechaza cambios en ciphertext, IV y etiqueta sin devolver texto parcial', () => {
  for (const field of ['ciphertext', 'iv', 'authTag']) {
    const encrypted = cipher.encrypt(userId, address);
    encrypted[field][0] ^= 1;
    assert.throws(() => cipher.decrypt(userId, encrypted), /No se pudo verificar/);
  }
});

test('AAD impide trasladar una dirección cifrada a otra cuenta', () => {
  assert.throws(
    () => cipher.decrypt(randomUUID(), cipher.encrypt(userId, address)),
    /No se pudo verificar/,
  );
});

test('Clave incorrecta, versión desconocida o etiqueta truncada se rechazan', () => {
  const encrypted = cipher.encrypt(userId, address);
  const otherCipher = createAddressCipher(randomBytes(32));
  assert.throws(
    () => otherCipher.decrypt(userId, { ...encrypted, keyId: otherCipher.keyId }),
    /No se pudo verificar/,
  );
  assert.throws(() => cipher.decrypt(userId, { ...encrypted, version: 2 }), /No se pudo verificar/);
  assert.throws(
    () => cipher.decrypt(userId, { ...encrypted, authTag: encrypted.authTag.subarray(0, 8) }),
    /No se pudo verificar/,
  );
});

test('Se rechazan claves de tamaño o formato inválidos', () => {
  assert.throws(() => createAddressCipher(randomBytes(16)), /32 bytes/);
  assert.throws(() => decodeAddressKey('clave-invalida'), /32 bytes/);
  assert.throws(() => decodeAddressKey('A'.repeat(43) + 'B'), /32 bytes/);
});

test('DPAPI conserva la clave entre arranques y no regenera una clave perdida con datos', async () => {
  const directory = fileURLToPath(
    new URL(`../../.local/crypto-test-${randomUUID()}/`, import.meta.url),
  );
  const path = join(directory, 'address-key.xml');
  await mkdir(directory, { recursive: true });
  try {
    await prepareAddressKey(path, []);
    const key = readAddressKeyFile(path);
    const keyId = createAddressCipher(key).keyId;
    await prepareAddressKey(path, [keyId]);
    assert.ok(readAddressKeyFile(path).equals(key), 'La clave existente debe conservarse.');
    await assert.rejects(prepareAddressKey(path, ['0'.repeat(32)]), /no corresponde/);
    assert.ok(
      readAddressKeyFile(path).equals(key),
      'No reemplazar la clave cuando hay discrepancias.',
    );
    await unlink(path);
    await assert.rejects(prepareAddressKey(path, [keyId]), /Recuperar la clave original/);
    assert.equal(existsSync(path), false);
    key.fill(0);
  } finally {
    if (existsSync(path)) await unlink(path);
    await rmdir(directory);
  }
});
