export const ITERATIONS = 600000;
export const MAX_ITERATIONS = 10000000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class WrongPassword extends Error {
  constructor() {
    super('The password is not right');
    this.name = 'WrongPassword';
  }
}

export function canEncrypt() {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto.getRandomValues);
}

export function randomBytes(length) {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

export function randomId() {
  return [...randomBytes(16)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function toBase64(bytes) {
  let text = '';
  for (let index = 0; index < bytes.length; index += 0x8000) text += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(text);
}

export function fromBase64(text) {
  const raw = atob(text);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

export async function deriveKey(password, salt, iterations = ITERATIONS) {
  const { subtle } = globalThis.crypto;
  const base = await subtle.importKey('raw', encoder.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function seal(key, value, label) {
  const iv = randomBytes(12);
  const data = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(label) },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}

export async function unseal(key, sealed, label) {
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(sealed.iv), additionalData: encoder.encode(label) },
    key,
    fromBase64(sealed.data),
  );
  return JSON.parse(decoder.decode(plain));
}
