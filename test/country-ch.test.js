import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney, findReferences, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { addPeriod, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const ch = countryById('ch');
const de = LANGUAGES.de;

test('ch Zahlungsbefehl: sender, kind, money and Rechtsvorschlag deadline', () => {
  const result = analyze(sampleText('ch', 'betreibung', TODAY), { today: TODAY, country: 'ch' });
  assert.equal(result.country.id, 'ch');
  assert.equal(result.sender.id, 'betreibungsamt');
  assert.equal(result.kind.id, 'zahlungsbefehl');
  assert.equal(result.kind.type, 'court-order');
  assert.equal(result.letterDate, '2026-10-08');
  assert.equal(result.urgency, 'high');

  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.iso, '2026-10-21');
  assert.equal(objection.estimated, true);
  assert.equal(objection.period, '10 days');
  assert.equal(objection.label, 'Last day to object (Rechtsvorschlag)');
  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.iso, '2026-10-31');
  assert.equal(payment.period, '20 days');

  assert.equal(result.money.toPay.amount, 1240.5);
  assert.equal(result.money.toPay.currency, 'CHF');
  assert.ok(result.money.items.some((item) => item.amount === 73.3));
  assert.equal(result.payment.iban, 'CH76 0900 0000 1234 5678 9');
  assert.equal(result.payment.recipient, 'Betreibungsamt Musterwil');
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [['Betreibungsnummer', '26012345'], ['Kundennummer', '5512-4471']]);
  assert.equal(result.objection, 'Rechtsvorschlag');
  assert.ok(result.terms.some((term) => term.term === 'Rechtsvorschlag'));
});

test('ch Zahlungsbefehl: steps and replies explain the Rechtsvorschlag', () => {
  const result = analyze(sampleText('ch', 'betreibung', TODAY), { today: TODAY, country: 'ch' });
  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /file a Rechtsvorschlag within 10 days/);
  assert.match(steps, /send a written objection \(Rechtsvorschlag\) by Wed, 21 Oct 2026 \(estimated\)/);
  assert.match(steps, /Betreibungsnummer\) 26012345/);

  const replies = buildReplies(result);
  const extra = replies.find((reply) => reply.id === 'rechtsvorschlag');
  assert.ok(extra);
  assert.match(extra.title, /Rechtsvorschlag/);
  assert.match(extra.local, /in der Betreibung Nr\. 26012345 erhebe ich Rechtsvorschlag gegen den Zahlungsbefehl vom 08\.10\.2026\./);
  assert.match(extra.local, /Freundliche Grüsse/);
  assert.doesNotMatch(extra.local, /ß/);
  assert.equal(replies.find((reply) => reply.id === 'objection'), undefined);
  assert.equal(replies.find((reply) => reply.id === 'more-time'), undefined);
});

test('ch fixed fine (Ordnungsbusse) offers no objection letter', () => {
  const result = analyze('Kantonspolizei Zürich\nOrdnungsbusse\nBusse: CHF 120.00\nZahlbar innert 30 Tagen.\nDatum: 08.10.2026', { today: TODAY, country: 'ch' });
  assert.equal(result.kind.id, 'ordnungsbusse');
  assert.equal(buildReplies(result).find((reply) => reply.id === 'objection'), undefined);
});

test('ch a year before CHF is not read as the amount', () => {
  const result = analyze('Prämie Oktober 2026 CHF 412.30\nBetreibung Nr. 26012345 CHF 1\'240.50', { today: TODAY, country: 'ch' });
  assert.deepEqual(result.money.items.map((item) => item.amount).sort((a, b) => a - b), [412.3, 1240.5]);
});

test('ch health insurance reminder: QR bill, total and payment date', () => {
  const result = analyze(sampleText('ch', 'krankenkasse', TODAY), { today: TODAY, country: 'ch' });
  assert.equal(result.sender.id, 'krankenkasse');
  assert.equal(result.kind.id, 'mahnung');
  assert.equal(result.kind.type, 'reminder');
  assert.equal(result.letterDate, '2026-10-09');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.estimated]), [['payment', '2026-10-23', false]]);
  assert.equal(result.money.toPay.amount, 406.4);
  assert.equal(result.money.toPay.currency, 'CHF');
  assert.equal(result.money.toPay.total, true);
  assert.equal(result.payment.iban, 'CH73 3000 0012 3456 7890 1');
  assert.equal(result.payment.reference, '00 00000 00000 12345 67890 12343');
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [
    ['Versichertennummer', '801234567'],
    ['AHV-Nummer', '756.1234.5678.97'],
    ['Rechnungsnummer', '2026-104-55871'],
  ]);
  assert.equal(result.objection, null);
  assert.equal(result.urgency, 'high');

  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Pay CHF\s406\.40 by Fri, 23 Oct 2026 to the account CH73 3000 0012 3456 7890 1/);
  const replies = buildReplies(result);
  assert.ok(!replies.some((reply) => reply.id === 'rechtsvorschlag'));
  const instalments = replies.find((reply) => reply.id === 'instalments');
  assert.match(instalments.local, /Gesuch um Ratenzahlung/);
  assert.match(instalments.local, /\[Ihre Strasse und Hausnummer\]/);
});

test('ch samples are detected as Swiss, German samples stay German', () => {
  for (const id of ['betreibung', 'krankenkasse']) {
    assert.equal(analyze(sampleText('ch', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'ch', id);
  }
  for (const id of ['tax', 'jobcenter', 'fee']) {
    assert.equal(analyze(sampleText('de', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'de', id);
  }
});

test('ch sample IBANs are valid Swiss IBANs', () => {
  assert.equal(isValidIban('CH76 0900 0000 1234 5678 9'), true);
  assert.equal(isValidIban('CH73 3000 0012 3456 7890 1'), true);
  assert.equal(isValidIban('CH73 3000 0012 3456 7890 2'), false);
});

test('ch amounts: apostrophe thousands, Fr. and trailing CHF', () => {
  assert.equal(findMoney("Betrag: CHF 1'234.50", ch).items[0].amount, 1234.5);
  assert.equal(findMoney('Busse: Fr. 120.–', ch).items[0].amount, 120);
  assert.equal(findMoney('Total 1’234.50 CHF', ch).items[0].amount, 1234.5);
  assert.equal(findMoney('Prämie: CHF 1 240.50', ch).items[0].amount, 1240.5);
  assert.equal(findMoney('Total 1’234.50 CHF', ch).items[0].currency, 'CHF');
});

test('ch deadlines: innert periods', () => {
  const [short] = findPeriods('Rechtsvorschlag innert 10 Tagen', de);
  assert.equal(short.amount, 10);
  assert.equal(short.unit, 'day');

  const [long] = findPeriods('Die Einsprache ist innert 30 Tagen seit Zustellung einzureichen.', de);
  assert.equal(long.amount, 30);
  assert.equal(long.unit, 'day');
  assert.equal(long.from, 'zustellung');
  assert.equal(addPeriod('2026-10-12', long), '2026-11-11');
});

test('ch references: AHV number with dots', () => {
  const [reference] = findReferences('AHV-Nr.: 756.1234.5678.97', ch);
  assert.equal(reference.local, 'AHV-Nummer');
  assert.equal(reference.value, '756.1234.5678.97');
});

test('ch Rechtsvorschlag template works without a letter', () => {
  const [extra] = ch.extraReplies;
  const body = extra.body({ country: ch, references: [], letterDate: null }).join('\n');
  assert.match(body, /Betreibung Nr\. \[Nummer\]/);
  assert.match(body, /vom \[TT\.MM\.JJJJ\]/);
  assert.equal(extra.when({ kind: { id: 'mahnung' } }), false);
});

test('ch pack shape', () => {
  const unique = (list) => new Set(list).size === list.length;
  assert.ok(unique(ch.senders.map((sender) => sender.slug)));
  assert.ok(unique(ch.kinds.map((kind) => kind.id)));
  assert.ok(unique(ch.glossary.map((entry) => entry.slug)));
  for (const slug of [...ch.senders, ...ch.glossary].map((item) => item.slug)) assert.match(slug, /^[a-z0-9-]+$/);
  const types = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];
  for (const kind of ch.kinds) assert.ok(types.includes(kind.type), kind.id);
  assert.ok(ch.references.some((reference) => reference.payment));
  assert.equal(ch.samples.length, 2);
});
