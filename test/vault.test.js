import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ITERATIONS, deriveKey, fromBase64, randomBytes, randomId, seal, toBase64, unseal } from '../web/src/vault.js';

const salt = randomBytes(16);

test('uses a slow key derivation by default', () => {
  assert.ok(ITERATIONS >= 600000);
});

test('base64 works both ways, also for long data', () => {
  const bytes = Uint8Array.from({ length: 100000 }, (_, index) => (index * 31) % 256);
  assert.deepEqual(fromBase64(toBase64(bytes)), bytes);
  assert.equal(toBase64(new Uint8Array()), '');
});

test('random ids are long and different', () => {
  const ids = new Set(Array.from({ length: 50 }, randomId));
  assert.equal(ids.size, 50);
  for (const id of ids) assert.match(id, /^[0-9a-f]{32}$/);
});

test('the key cannot be read back out', async () => {
  const key = await deriveKey('correct horse', salt, 1000);
  assert.equal(key.extractable, false);
  assert.deepEqual(key.usages.sort(), ['decrypt', 'encrypt']);
  assert.equal(key.algorithm.name, 'AES-GCM');
  assert.equal(key.algorithm.length, 256);
});

test('seals and opens a value with the right key', async () => {
  const key = await deriveKey('correct horse', salt, 1000);
  const value = { text: 'Steuerbescheid über 412,00 €', note: 'Bezahlt? Nein ✓' };
  const sealed = await seal(key, value, 'letter-1');
  assert.ok(!sealed.data.includes('Steuerbescheid'));
  assert.ok(!Buffer.from(sealed.data, 'base64').toString('utf8').includes('Steuerbescheid'));
  assert.equal(fromBase64(sealed.iv).length, 12);
  assert.deepEqual(await unseal(key, sealed, 'letter-1'), value);
});

test('uses a new random IV every time', async () => {
  const key = await deriveKey('correct horse', salt, 1000);
  const first = await seal(key, 'same', 'x');
  const second = await seal(key, 'same', 'x');
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.data, second.data);
});

test('a wrong password, another salt or another label cannot open it', async () => {
  const key = await deriveKey('correct horse', salt, 1000);
  const sealed = await seal(key, 'secret', 'letter-1');
  await assert.rejects(unseal(await deriveKey('wrong horse', salt, 1000), sealed, 'letter-1'));
  await assert.rejects(unseal(await deriveKey('correct horse', randomBytes(16), 1000), sealed, 'letter-1'));
  await assert.rejects(unseal(key, sealed, 'letter-2'));
});

test('a changed byte is noticed', async () => {
  const key = await deriveKey('correct horse', salt, 1000);
  const sealed = await seal(key, 'secret', 'letter-1');
  const bytes = fromBase64(sealed.data);
  bytes[0] ^= 1;
  await assert.rejects(unseal(key, { ...sealed, data: toBase64(bytes) }, 'letter-1'));
});

test('the same password written in two Unicode forms gives the same key', async () => {
  const composed = await deriveKey('Käse-Brot', salt, 1000);
  const decomposed = await deriveKey('Käse-Brot', salt, 1000);
  assert.equal(await unseal(decomposed, await seal(composed, 'ok', 'x'), 'x'), 'ok');
});
