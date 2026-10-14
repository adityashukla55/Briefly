import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-14';
const pack = countryById('se');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, preferred: 'de' });
const sample = (id) => analyze(sampleText('se', id, TODAY), { today: TODAY, country: 'se' });
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const dates = (result) => result.dates.map((date) => [date.type, date.iso]);

test('pack has the expected shape', () => {
  assert.equal(pack.slug, 'sweden');
  assert.equal(pack.language, 'sv');
  assert.equal(pack.currency, 'SEK');
  assert.ok(pack.senders.length >= 13 && pack.senders.length <= 16);
  assert.ok(pack.kinds.length >= 12 && pack.kinds.length <= 20);
  assert.ok(pack.references.length >= 7 && pack.references.length <= 12);
  assert.ok(pack.glossary.length >= 35 && pack.glossary.length <= 55);
  assert.equal(pack.samples.length, 2);
  for (const kind of pack.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [pack.senders, pack.kinds, pack.glossary]) {
    const ids = list.map((item) => item.id ?? item.slug);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...pack.senders, ...pack.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const stateless = [...pack.signals, ...pack.objection.map((entry) => entry.pattern), ...pack.glossary.map((entry) => entry.pattern), ...[...pack.senders, ...pack.kinds].flatMap((item) => item.patterns)];
  for (const pattern of stateless) assert.ok(!pattern.global, String(pattern));
  assert.ok(pack.references.some((reference) => reference.local === 'Personnummer' && reference.personal));
  const english = [pack.intro, pack.deliveryNote, pack.objectionAdvice, ...pack.senders.flatMap((sender) => [sender.name, sender.about, ...sender.tips]), ...pack.kinds.flatMap((kind) => [kind.name, kind.about, ...(kind.steps ?? [])]), ...pack.glossary.flatMap((entry) => [entry.meaning, entry.tip ?? ''])];
  for (const text of english) assert.ok(!text.includes('\''), text);
});

test('first sample: amount, way to pay, deadline and replies', () => {
  const result = sample('forsakringskassan');
  assert.equal(result.sender.id, 'forsakringskassan');
  assert.equal(result.kind.id, 'aterkrav');
  assert.equal(result.letterDate, '2026-10-11');
  assert.deepEqual(dates(result), [['payment', '2026-11-10'], ['objection', '2026-12-13']]);
  assert.equal(result.money.toPay.amount, 4320);
  assert.equal(result.money.toPay.currency, 'SEK');
  assert.equal(result.payment.account.text, 'bankgiro 123-4567');
  assert.equal(result.payment.reference, '8507301234567');
  assert.match(stepText(result), /Pay SEK\s4,320\.00 by Tue, 10 Nov 2026 to bankgiro 123-4567\./);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments', 'more-time']);
  assert.match(replies[0].local, /Jag begär omprövning av ert beslut daterat 2026-10-11\./);
  assert.match(replies[1].local, /4\s320,00\skr/);
});

test('second sample: appointment with time', () => {
  const result = sample('migrationsverket');
  assert.equal(result.sender.id, 'migrationsverket');
  assert.equal(result.kind.id, 'kallelse');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-22', '09:30']]);
  assert.deepEqual(result.references.map((reference) => reference.value), ['25-123456']);
  assert.match(buildReplies(result)[0].local, /Jag har fått en kallelse den 2026-10-22 kl\. 09:30\./);
});

test('samples are detected without picking the country', () => {
  for (const id of ['forsakringskassan', 'migrationsverket']) assert.equal(run(sampleText('se', id, TODAY)).country.id, 'se');
});

test('payment order from Kronofogden: dispute letter and deadline', () => {
  const result = run(`Kronofogden
Datum: 2026-10-09
Målnummer: 12-345678-26
Betalningsföreläggande
Exempel Finans AB har ansökt om att du ska betala 12 450 kr.
Om du inte håller med om kravet måste du bestrida det. Ditt svar ska ha kommit in till Kronofogden senast 2026-10-23.`);
  assert.equal(result.kind.id, 'betalningsforelaggande');
  assert.equal(result.money.toPay.amount, 12450);
  assert.deepEqual(dates(result), [['deadline', '2026-10-23']]);
  assert.equal(buildReplies(result)[0].id, 'bestrida');
  assert.match(buildReplies(result)[0].local, /målnummer 12-345678-26/);
});

test('debt collector letter: total to pay, bankgiro and OCR', () => {
  const result = run(`Exempel Inkasso AB
Datum: 2026-10-07
Inkassokrav
Kapitalbelopp: 899 kr
Påminnelseavgift: 60 kr
Att betala: 1 139 kr
Betala senast 2026-10-17 till bankgiro 234-5678 med OCR 99887766.`);
  assert.equal(result.kind.id, 'inkassokrav');
  assert.equal(result.money.toPay.amount, 1139);
  assert.equal(result.payment.account.text, 'bankgiro 234-5678');
  assert.equal(result.payment.reference, '99887766');
});

test('template letters exist', () => {
  assert.ok(templateLetters(pack).length >= 4);
});
