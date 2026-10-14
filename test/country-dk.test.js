import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-14';
const pack = countryById('dk');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, preferred: 'de' });
const sample = (id) => analyze(sampleText('dk', id, TODAY), { today: TODAY, country: 'dk' });
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const dates = (result) => result.dates.map((date) => [date.type, date.iso]);

test('pack has the expected shape', () => {
  assert.equal(pack.slug, 'denmark');
  assert.equal(pack.language, 'da');
  assert.equal(pack.currency, 'DKK');
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
  assert.ok(pack.references.some((reference) => reference.local === 'CPR-nummer' && reference.personal));
  const english = [pack.intro, pack.deliveryNote, pack.objectionAdvice, ...pack.senders.flatMap((sender) => [sender.name, sender.about, ...sender.tips]), ...pack.kinds.flatMap((kind) => [kind.name, kind.about, ...(kind.steps ?? [])]), ...pack.glossary.flatMap((entry) => [entry.meaning, entry.tip ?? ''])];
  for (const text of english) assert.ok(!text.includes('\''), text);
});

test('first sample: amount, way to pay, deadline and replies', () => {
  const result = sample('udbetaling-danmark');
  assert.equal(result.sender.id, 'udbetaling-danmark');
  assert.equal(result.kind.id, 'tilbagebetaling');
  assert.equal(result.letterDate, '2026-10-11');
  assert.deepEqual(dates(result), [['payment', '2026-11-10'], ['objection', '2026-11-10']]);
  assert.equal(result.money.toPay.amount, 3245);
  assert.equal(result.money.toPay.currency, 'DKK');
  assert.equal(result.payment.account.text, 'FI card +71<123456789012345 +87654321<');
  assert.match(stepText(result), /Pay DKK\s3,245\.00 by Tue, 10 Nov 2026 to FI card \+71<123456789012345 \+87654321<\./);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments', 'more-time']);
  assert.match(replies[0].local, /Jeg klager hermed over jeres afgørelse af 11\.10\.2026\./);
  assert.match(replies[1].local, /3\.245,00\s?kr\./);
});

test('second sample: appointment with time', () => {
  const result = sample('jobcenter');
  assert.equal(result.sender.id, 'jobcenter');
  assert.equal(result.kind.id, 'indkaldelse');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-22', '09:30']]);
  assert.match(buildReplies(result)[0].local, /Jeg er indkaldt til et møde den 22\.10\.2026 kl\. 09:30\./);
});

test('samples are detected without picking the country', () => {
  for (const id of ['udbetaling-danmark', 'jobcenter']) assert.equal(run(sampleText('dk', id, TODAY)).country.id, 'dk');
});

test('yearly tax statement: restskat and 3 months to complain', () => {
  const result = run(`Skattestyrelsen
Dato: 08.10.2026
CPR-nr.: 300785-1234
Årsopgørelse for 2025
Du har en restskat på 4.512,00 kr.
Hvis du betaler restskatten senest den 1. juli 2027, skal du kun betale dag-til-dag-rente.
Du kan klage over din årsopgørelse inden 3 måneder.`);
  assert.equal(result.kind.id, 'aarsopgoerelse');
  assert.equal(result.money.toPay.amount, 4512);
  assert.deepEqual(dates(result), [['objection', '2027-01-10'], ['payment', '2027-07-01']]);
});

test('speeding fine: past offence time is not an appointment', () => {
  const result = run(`Politiet
Dato: 09.10.2026
Bødeforelæg
Dit køretøj blev fotograferet af en fotovogn den 1. oktober 2026 kl. 14.22.
Bøde: 1.200,00 kr.
Hvis du vil vedtage bøden, skal du betale senest den 30.10.2026.`);
  assert.equal(result.kind.id, 'boede');
  assert.equal(result.money.toPay.amount, 1200);
  assert.deepEqual(dates(result), [['payment', '2026-10-30']]);
});

test('template letters exist', () => {
  assert.ok(templateLetters(pack).length >= 4);
});
