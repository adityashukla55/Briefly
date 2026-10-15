import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze } from '../web/src/analyze.js';
import { sampleText } from '../web/src/countries/index.js';
import { BadBackup, Locked, MIN_PASSWORD, NOTE_LIMIT, WrongPassword, createFolder, nextDeadline, openDeadlines, parseBackup, searchLetters, summarize } from '../web/src/folder.js';
import { fakeIndexedDB } from './fake-indexeddb.js';

const TODAY = '2026-10-15';
const PASSWORD = 'my long password';

function newFolder(indexedDB = fakeIndexedDB()) {
  return { indexedDB, folder: createFolder({ indexedDB, iterations: 1000 }) };
}

function letterFrom(country, id) {
  const result = analyze(sampleText(country, id, TODAY), { country, today: TODAY });
  return { text: result.text, country, summary: summarize(result) };
}

function rows(indexedDB, store) {
  return [...indexedDB.databases.get('briefly-letters').stores.get(store).rows.values()];
}

test('a new device has no folder, and nothing is stored before the first keep', async () => {
  const { indexedDB, folder } = newFolder();
  assert.equal(await folder.exists(), false);
  assert.equal(folder.isUnlocked(), false);
  assert.equal(rows(indexedDB, 'letters').length, 0);
});

test('the password must be long enough', async () => {
  const { folder } = newFolder();
  await assert.rejects(folder.create('short'), /at least/);
  assert.equal(MIN_PASSWORD, 8);
  assert.equal(await folder.exists(), false);
});

test('keeps a letter encrypted, never the password', async () => {
  const { indexedDB, folder } = newFolder();
  await folder.create(PASSWORD);
  const letter = letterFrom('de', 'tax');
  const { id, updated } = await folder.keep(letter, new Date('2026-10-15T09:00:00Z'));
  assert.equal(updated, false);
  await folder.update(id, { note: 'Ask Anna about this' });

  const stored = JSON.stringify([...rows(indexedDB, 'meta'), ...rows(indexedDB, 'letters')]);
  for (const secret of [PASSWORD, 'Finanzamt', 'Steuerbescheid', '412', 'Anna', '214/123/45678', 'de"', '2026-10-15']) {
    assert.ok(!stored.includes(secret), `found ${secret} in storage`);
  }
  const [record] = rows(indexedDB, 'letters');
  assert.deepEqual(Object.keys(record).sort(), ['data', 'id', 'iv']);

  const [saved] = await folder.letters();
  assert.equal(saved.id, id);
  assert.equal(saved.text, letter.text);
  assert.equal(saved.country, 'de');
  assert.equal(saved.note, 'Ask Anna about this');
  assert.equal(saved.done, false);
  assert.equal(saved.savedAt, '2026-10-15T09:00:00.000Z');
  assert.equal(saved.summary.kind.name, 'Tax assessment');
});

test('locks, refuses a wrong password and opens with the right one', async () => {
  const indexedDB = fakeIndexedDB();
  const first = createFolder({ indexedDB, iterations: 1000 });
  await first.create(PASSWORD);
  await first.keep(letterFrom('de', 'tax'));
  first.lock();
  assert.equal(first.isUnlocked(), false);
  await assert.rejects(first.letters(), Locked);
  await assert.rejects(first.keep(letterFrom('de', 'tax')), Locked);

  const later = createFolder({ indexedDB, iterations: 1000 });
  assert.equal(await later.exists(), true);
  assert.equal(later.isUnlocked(), false);
  await assert.rejects(later.unlock('my long passwort'), WrongPassword);
  await assert.rejects(later.unlock(''), WrongPassword);
  assert.equal(later.isUnlocked(), false);
  await later.unlock(PASSWORD);
  assert.equal(later.isUnlocked(), true);
  assert.equal((await later.letters()).length, 1);
});

test('a second folder cannot be made over the first one', async () => {
  const { folder } = newFolder();
  await folder.create(PASSWORD);
  await assert.rejects(folder.create('another password'), /already/);
});

test('keeping the same letter again updates it instead of making a copy', async () => {
  const { folder } = newFolder();
  await folder.create(PASSWORD);
  const letter = letterFrom('de', 'tax');
  const first = await folder.keep(letter);
  const again = await folder.keep({ ...letter, country: 'at' });
  assert.equal(again.id, first.id);
  assert.equal(again.updated, true);
  const letters = await folder.letters();
  assert.equal(letters.length, 1);
  assert.equal(letters[0].country, 'at');
});

test('marks letters as done, keeps a short note and deletes one letter', async () => {
  const { folder } = newFolder();
  await folder.create(PASSWORD);
  const tax = await folder.keep(letterFrom('de', 'tax'), new Date('2026-10-14T10:00:00Z'));
  const fee = await folder.keep(letterFrom('de', 'fee'), new Date('2026-10-15T10:00:00Z'));
  assert.deepEqual((await folder.letters()).map((letter) => letter.id), [fee.id, tax.id]);

  await folder.update(tax.id, { done: true, note: `  ${'x'.repeat(NOTE_LIMIT + 50)}  ` });
  const updated = await folder.get(tax.id);
  assert.equal(updated.done, true);
  assert.equal(updated.note.length, NOTE_LIMIT);
  await folder.update(tax.id, { done: false });
  assert.equal((await folder.get(tax.id)).done, false);
  assert.equal((await folder.get(tax.id)).note.length, NOTE_LIMIT);

  await folder.remove(tax.id);
  assert.equal(await folder.get(tax.id), null);
  assert.deepEqual((await folder.letters()).map((letter) => letter.id), [fee.id]);
  await assert.rejects(folder.update(tax.id, { done: true }), /not in the folder/);
});

test('letters cannot be swapped between places in storage', async () => {
  const { indexedDB, folder } = newFolder();
  await folder.create(PASSWORD);
  const tax = await folder.keep(letterFrom('de', 'tax'));
  const fee = await folder.keep(letterFrom('de', 'fee'));
  const store = indexedDB.databases.get('briefly-letters').stores.get('letters').rows;
  store.set(fee.id, { ...store.get(tax.id), id: fee.id });
  await assert.rejects(folder.get(fee.id));
});

test('delete everything removes the letters and the password', async () => {
  const { indexedDB, folder } = newFolder();
  await folder.create(PASSWORD);
  await folder.keep(letterFrom('de', 'tax'));
  folder.lock();
  await folder.destroy();
  assert.equal(await folder.exists(), false);
  assert.equal(folder.isUnlocked(), false);
  assert.equal(rows(indexedDB, 'letters').length, 0);
  assert.equal(rows(indexedDB, 'meta').length, 0);
  await folder.create('a brand new password');
  assert.deepEqual(await folder.letters(), []);
});

test('a backup file stays encrypted and restores on a new device', async () => {
  const { folder } = newFolder();
  await folder.create(PASSWORD);
  await folder.keep(letterFrom('de', 'tax'));
  const { id } = await folder.keep(letterFrom('fr', 'tax'));
  await folder.update(id, { note: 'Pay before the trip', done: true });
  const file = JSON.stringify(await folder.backup(new Date('2026-10-15T12:00:00Z')));
  assert.ok(!file.includes('Finanzamt'));
  assert.ok(!file.includes('Pay before the trip'));
  assert.ok(!file.includes(PASSWORD));

  const { folder: other } = newFolder();
  assert.equal(other.needsPassword(file), true);
  await assert.rejects(other.restore(file, 'not the password'), WrongPassword);
  assert.equal(await other.exists(), false);
  const { added } = await other.restore(file, PASSWORD);
  assert.equal(added, 2);
  assert.equal(other.isUnlocked(), true);
  const restored = await other.get(id);
  assert.equal(restored.note, 'Pay before the trip');
  assert.equal(restored.done, true);

  other.lock();
  await other.unlock(PASSWORD);
  assert.equal((await other.letters()).length, 2);
});

test('a backup from another folder is added without copies', async () => {
  const { folder: home } = newFolder();
  await home.create(PASSWORD);
  await home.keep(letterFrom('de', 'tax'));
  const homeFile = await home.backup();
  assert.equal(home.needsPassword(homeFile), false);
  assert.deepEqual(await home.restore(homeFile), { added: 0, skipped: 1 });

  const { folder: work } = newFolder();
  await work.create('the work password');
  await work.keep(letterFrom('de', 'tax'));
  await work.keep(letterFrom('de', 'jobcenter'));
  const workFile = await work.backup();

  assert.equal(home.needsPassword(workFile), true);
  await assert.rejects(home.restore(workFile, PASSWORD), WrongPassword);
  assert.deepEqual(await home.restore(workFile, 'the work password'), { added: 1, skipped: 1 });
  assert.equal((await home.letters()).length, 2);
  home.lock();
  await home.unlock(PASSWORD);
  assert.equal((await home.letters()).length, 2);
});

test('rejects files that are not a backup', async () => {
  const { folder } = newFolder();
  for (const junk of ['not json', '{}', JSON.stringify({ type: 'briefly-letter-folder', version: 1 }), null]) {
    assert.throws(() => parseBackup(junk), BadBackup);
    await assert.rejects(folder.restore(junk, PASSWORD), BadBackup);
  }
  await folder.create(PASSWORD);
  const backup = await folder.backup();
  assert.throws(() => parseBackup({ ...backup, iterations: 1e12 }), BadBackup);
});

test('a damaged backup is refused as a whole', async () => {
  const { folder } = newFolder();
  await folder.create(PASSWORD);
  await folder.keep(letterFrom('de', 'tax'));
  const backup = await folder.backup();
  backup.letters[0].data = backup.letters[0].data.replace(/^./, (char) => (char === 'A' ? 'B' : 'A'));
  const { folder: other } = newFolder();
  await assert.rejects(other.restore(backup, PASSWORD), /damaged/);
  assert.equal(await other.exists(), false);
});

test('the summary keeps what was found, not the whole analysis', () => {
  const { summary } = letterFrom('de', 'tax');
  assert.deepEqual(summary.kind, { name: 'Tax assessment', local: 'Steuerbescheid' });
  assert.equal(summary.sender.local, 'Finanzamt');
  assert.equal(summary.toPay.amount, 412);
  assert.equal(summary.toPay.currency, 'EUR');
  assert.ok(summary.references.some((reference) => reference.value === '214/123/45678'));
  assert.deepEqual(summary.dates.map((date) => date.type), ['payment', 'objection']);
  assert.ok(summary.dates.every((date) => !('daysLeft' in date) && !('source' in date)));
  assert.doesNotThrow(() => structuredClone(summary));
});

function kept(id, dates, extra = {}) {
  return { id, text: id, country: 'de', savedAt: '2026-10-01T00:00:00Z', note: '', done: false, summary: { dates }, ...extra };
}

test('lists open deadlines with the next one on top', () => {
  const letters = [
    kept('a', [{ type: 'payment', label: 'Pay by', iso: '2026-11-01' }, { type: 'start', label: 'Starts', iso: '2026-10-20' }]),
    kept('b', [{ type: 'appointment', label: 'Appointment', iso: '2026-10-17', time: '14:00' }, { type: 'deadline', label: 'Deadline', iso: '2026-10-10' }]),
    kept('c', [{ type: 'appointment', label: 'Appointment', iso: '2026-10-17', time: '09:30' }]),
    kept('d', [{ type: 'payment', label: 'Pay by', iso: '2026-10-16' }], { done: true }),
    kept('e', [{ type: 'objection', label: 'Last day to object', iso: null, period: '1 month' }, { type: 'payment', label: 'Pay by', iso: '2026-09-30' }]),
  ];
  const { upcoming, passed } = openDeadlines(letters, TODAY);
  assert.deepEqual(upcoming.map((item) => `${item.letter.id}:${item.date.iso}:${item.daysLeft}`), ['c:2026-10-17:2', 'b:2026-10-17:2', 'a:2026-11-01:17']);
  assert.deepEqual(passed.map((item) => `${item.letter.id}:${item.daysLeft}`), ['b:-5', 'e:-15']);
  assert.equal(nextDeadline(letters[0], TODAY).date.iso, '2026-11-01');
  assert.equal(nextDeadline(letters[4], TODAY), null);
});

test('searches the letters, the note and the found details', () => {
  const letters = [
    kept('tax', [], { text: 'Finanzamt Köln Steuerbescheid', note: 'Call Anna', summary: { kind: { name: 'Tax assessment', local: 'Steuerbescheid' }, sender: { name: 'Tax office', local: 'Finanzamt' }, references: [{ name: 'Tax number', value: '214/123/45678' }], dates: [] } }),
    kept('fee', [], { text: 'Beitragsservice Zahlungserinnerung', country: 'at', summary: { kind: { name: 'Payment reminder', local: 'Zahlungserinnerung' }, sender: null, references: [], dates: [] } }),
  ];
  const ids = (query) => searchLetters(letters, query, (id) => ({ de: 'Germany', at: 'Austria' })[id]).map((letter) => letter.id);
  assert.deepEqual(ids(''), ['tax', 'fee']);
  assert.deepEqual(ids('   '), ['tax', 'fee']);
  assert.deepEqual(ids('anna'), ['tax']);
  assert.deepEqual(ids('koln'), ['tax']);
  assert.deepEqual(ids('214/123'), ['tax']);
  assert.deepEqual(ids('reminder'), ['fee']);
  assert.deepEqual(ids('austria'), ['fee']);
  assert.deepEqual(ids('tax office'), ['tax']);
  assert.deepEqual(ids('tax austria'), []);
});
