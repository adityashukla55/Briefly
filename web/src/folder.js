import { daysBetween } from './dates.js';
import { ITERATIONS, MAX_ITERATIONS, WrongPassword, deriveKey, fromBase64, randomBytes, randomId, seal, toBase64, unseal } from './vault.js';

export { WrongPassword };

export const DB_NAME = 'briefly-letters';
export const MIN_PASSWORD = 8;
export const NOTE_LIMIT = 300;

const CHECK = 'briefly-letter-folder';
const BACKUP_TYPE = 'briefly-letter-folder';

export class BadBackup extends Error {
  constructor(message = 'This is not a Briefly backup file') {
    super(message);
    this.name = 'BadBackup';
  }
}

export class Locked extends Error {
  constructor() {
    super('The folder is locked');
    this.name = 'Locked';
  }
}

function finished(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function openDatabase(indexedDB, name = DB_NAME) {
  const opening = indexedDB.open(name, 1);
  opening.onupgradeneeded = () => {
    const db = opening.result;
    for (const store of ['meta', 'letters']) {
      if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
    }
  };
  const db = await finished(opening);
  db.onversionchange = () => db.close();
  const run = (stores, mode, action) => new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, mode);
    const request = action((store) => transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving was stopped'));
  });
  return {
    get: (store, id) => run(store, 'readonly', (open) => open(store).get(id)),
    all: (store) => run(store, 'readonly', (open) => open(store).getAll()),
    put: (store, value) => run(store, 'readwrite', (open) => open(store).put(value)),
    remove: (store, id) => run(store, 'readwrite', (open) => open(store).delete(id)),
    batch: (steps) => run(['meta', 'letters'], 'readwrite', (open) => {
      for (const [action, store, value] of steps) {
        if (action === 'put') open(store).put(value);
        else if (action === 'delete') open(store).delete(value);
        else if (action === 'clear') open(store).clear();
      }
      return null;
    }),
    close: () => db.close(),
  };
}

function isSealed(value) {
  return typeof value?.iv === 'string' && typeof value?.data === 'string';
}

export function parseBackup(data) {
  let backup = data;
  if (typeof data === 'string') {
    try {
      backup = JSON.parse(data);
    } catch {
      throw new BadBackup();
    }
  }
  const valid = backup?.type === BACKUP_TYPE
    && backup.version === 1
    && typeof backup.salt === 'string'
    && Number.isInteger(backup.iterations) && backup.iterations >= 1 && backup.iterations <= MAX_ITERATIONS
    && isSealed(backup.check)
    && Array.isArray(backup.letters)
    && backup.letters.every((record) => typeof record?.id === 'string' && record.id !== '' && isSealed(record));
  if (!valid) throw new BadBackup();
  return backup;
}

export function createFolder({ indexedDB = globalThis.indexedDB, name = DB_NAME, iterations = ITERATIONS } = {}) {
  let database = null;
  let key = null;
  let salt = null;

  const db = () => {
    database ??= openDatabase(indexedDB, name).catch((error) => {
      database = null;
      throw error;
    });
    return database;
  };

  const meta = async () => (await db()).get('meta', 'folder');

  const matches = async (candidate, record) => {
    try {
      return (await unseal(candidate, record.check, 'check')) === CHECK;
    } catch {
      return false;
    }
  };

  const needKey = () => {
    if (!key) throw new Locked();
    return key;
  };

  const open = async (record, withKey = needKey()) => ({ ...(await unseal(withKey, record, record.id)), id: record.id });

  const readAll = async () => {
    const current = needKey();
    const records = await (await db()).all('letters');
    const letters = await Promise.all(records.map((record) => open(record, current)));
    return letters.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  };

  const write = async (letter) => {
    const { id, ...content } = letter;
    await (await db()).put('letters', { id, ...(await seal(needKey(), content, id)) });
    return letter;
  };

  const get = async (id) => {
    const current = needKey();
    const record = await (await db()).get('letters', id);
    return record ? open(record, current) : null;
  };

  return {
    async exists() {
      return Boolean(await meta());
    },

    isUnlocked() {
      return Boolean(key);
    },

    async create(password) {
      if (typeof password !== 'string' || password.length < MIN_PASSWORD) throw new Error(`The password needs at least ${MIN_PASSWORD} characters`);
      if (await meta()) throw new Error('A folder already exists');
      const newSalt = randomBytes(16);
      const newKey = await deriveKey(password, newSalt, iterations);
      const record = { id: 'folder', version: 1, salt: toBase64(newSalt), iterations, check: await seal(newKey, CHECK, 'check') };
      await (await db()).put('meta', record);
      key = newKey;
      salt = record.salt;
    },

    async unlock(password) {
      const record = await meta();
      if (!record) throw new Error('There is no folder yet');
      const candidate = await deriveKey(password, fromBase64(record.salt), record.iterations);
      if (!(await matches(candidate, record))) throw new WrongPassword();
      key = candidate;
      salt = record.salt;
    },

    lock() {
      key = null;
      salt = null;
    },

    letters: readAll,

    get,

    async keep({ text, country, summary }, now = new Date()) {
      needKey();
      const same = (await readAll()).find((letter) => letter.text === text);
      if (same) {
        await write({ ...same, country, summary });
        return { id: same.id, updated: true };
      }
      const letter = { id: randomId(), text, country, summary, savedAt: now.toISOString(), note: '', done: false };
      await write(letter);
      return { id: letter.id, updated: false };
    },

    async update(id, changes) {
      const letter = await get(id);
      if (!letter) throw new Error('This letter is not in the folder');
      const next = { ...letter };
      if ('note' in changes) next.note = String(changes.note ?? '').trim().slice(0, NOTE_LIMIT);
      if ('done' in changes) next.done = Boolean(changes.done);
      return write(next);
    },

    async remove(id) {
      needKey();
      await (await db()).remove('letters', id);
    },

    async destroy() {
      await (await db()).batch([['clear', 'meta'], ['clear', 'letters']]);
      key = null;
      salt = null;
    },

    async backup(now = new Date()) {
      needKey();
      const record = await meta();
      const letters = await (await db()).all('letters');
      return {
        type: BACKUP_TYPE,
        version: 1,
        made: now.toISOString(),
        salt: record.salt,
        iterations: record.iterations,
        check: record.check,
        letters: letters.map(({ id, iv, data }) => ({ id, iv, data })),
      };
    },

    needsPassword(backup) {
      return !(key && parseBackup(backup).salt === salt);
    },

    async restore(data, password = '') {
      const backup = parseBackup(data);
      const own = key && backup.salt === salt;
      const backupKey = own ? key : await deriveKey(password, fromBase64(backup.salt), backup.iterations);
      if (!(await matches(backupKey, backup))) throw new WrongPassword();
      let letters;
      try {
        letters = await Promise.all(backup.letters.map((record) => open(record, backupKey)));
      } catch {
        throw new BadBackup('Part of this backup file is damaged');
      }
      if (!(await meta())) {
        await (await db()).batch([
          ['put', 'meta', { id: 'folder', version: 1, salt: backup.salt, iterations: backup.iterations, check: backup.check }],
          ...backup.letters.map(({ id, iv, data: sealed }) => ['put', 'letters', { id, iv, data: sealed }]),
        ]);
        key = backupKey;
        salt = backup.salt;
        return { added: letters.length, skipped: 0 };
      }
      const existing = await readAll();
      const ids = new Set(existing.map((letter) => letter.id));
      const texts = new Set(existing.map((letter) => letter.text));
      let added = 0;
      for (const letter of letters) {
        if (ids.has(letter.id) || texts.has(letter.text)) continue;
        await write(letter);
        ids.add(letter.id);
        texts.add(letter.text);
        added += 1;
      }
      return { added, skipped: letters.length - added };
    },
  };
}

function money(value) {
  return value ? { amount: value.amount, currency: value.currency, monthly: Boolean(value.monthly) } : null;
}

export function summarize(result) {
  const references = result.references.map(({ name, value }) => ({ name, value }));
  const reference = result.payment?.reference;
  if (reference && !references.some((item) => item.value === reference)) references.unshift({ name: 'Payment reference', value: reference });
  return {
    kind: result.kind ? { name: result.kind.name, local: result.kind.local } : null,
    sender: result.sender ? { name: result.sender.name, local: result.sender.local } : null,
    letterDate: result.letterDate ?? null,
    dates: result.dates.map(({ type, label, iso, time, estimated, period }) => ({ type, label, iso: iso ?? null, time: time ?? null, estimated: Boolean(estimated), period: period ?? null })),
    toPay: money(result.money.toPay),
    toGet: money(result.money.toGet),
    references,
  };
}

function datesOf(letter, today) {
  return (letter.summary?.dates ?? [])
    .filter((date) => date.iso && date.type !== 'start')
    .map((date) => ({ letter, date, daysLeft: daysBetween(today, date.iso) }));
}

export function openDeadlines(letters, today) {
  const items = letters.filter((letter) => !letter.done).flatMap((letter) => datesOf(letter, today));
  return {
    upcoming: items.filter((item) => item.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft || (a.date.time ?? '').localeCompare(b.date.time ?? '')),
    passed: items.filter((item) => item.daysLeft < 0).sort((a, b) => b.daysLeft - a.daysLeft),
  };
}

export function nextDeadline(letter, today) {
  return datesOf(letter, today).filter((item) => item.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)[0] ?? null;
}

function fold(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function searchLetters(letters, query, countryName = (id) => id) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return letters;
  return letters.filter((letter) => {
    const { kind, sender, references = [] } = letter.summary ?? {};
    const haystack = fold([
      kind?.name, kind?.local, sender?.name, sender?.local, letter.note, countryName(letter.country),
      ...references.map((reference) => reference.value), letter.text,
    ].filter(Boolean).join('\n'));
    return words.every((word) => haystack.includes(word));
  });
}
