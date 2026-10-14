import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { buildReplies } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-14';
const ie = countryById('ie');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, preferred: 'de' });
const sample = (id) => analyze(sampleText('ie', id, TODAY), { today: TODAY, country: 'ie' });
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const dates = (result) => result.dates.map((date) => [date.type, date.iso]);

test('pack has the expected shape', () => {
  assert.equal(ie.slug, 'ireland');
  assert.equal(ie.language, 'en');
  assert.equal(ie.currency, 'EUR');
  assert.equal(ie.dateOrder, 'dmy');
  assert.ok(ie.senders.length >= 13 && ie.senders.length <= 16);
  assert.ok(ie.kinds.length >= 12 && ie.kinds.length <= 20);
  assert.ok(ie.references.length >= 8 && ie.references.length <= 12);
  assert.ok(ie.glossary.length >= 35 && ie.glossary.length <= 55);
  assert.equal(ie.samples.length, 2);
  for (const kind of ie.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [ie.senders, ie.kinds, ie.glossary]) {
    const ids = list.map((item) => item.id ?? item.slug);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...ie.senders, ...ie.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const stateless = [...ie.signals, ...ie.objection.map((entry) => entry.pattern), ...ie.glossary.map((entry) => entry.pattern), ...[...ie.senders, ...ie.kinds].flatMap((item) => item.patterns)];
  for (const pattern of stateless) assert.ok(!pattern.global, String(pattern));
  assert.ok(ie.references.some((reference) => reference.local === 'PPS number' && reference.personal));
  const english = [ie.intro, ie.deliveryNote, ie.objectionAdvice, ...ie.senders.flatMap((sender) => [sender.name, sender.about, ...sender.tips]), ...ie.kinds.flatMap((kind) => [kind.name, kind.about, ...(kind.steps ?? [])]), ...ie.glossary.flatMap((entry) => [entry.meaning, entry.tip ?? ''])];
  for (const text of english) assert.ok(!text.includes('\''), text);
});

test('Revenue sample: tax to pay, Irish IBAN and 30 days to appeal', () => {
  const result = sample('revenue');
  assert.equal(result.sender.id, 'revenue');
  assert.equal(result.kind.id, 'tax-bill');
  assert.equal(result.letterDate, '2026-10-11');
  assert.deepEqual(dates(result), [['payment', '2026-11-10'], ['objection', '2026-11-10']]);
  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.payment.iban, 'IE29 AIBK 9311 5212 3456 78');
  assert.ok(isValidIban(result.payment.iban));
  assert.equal(result.payment.bic, 'AIBKIE2D');
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments', 'more-time']);
  assert.match(replies[0].local, /Yours faithfully,/);
  assert.match(replies[1].local, /€1,234\.56/);
});

test('Intreo sample: meeting with a time and the PPS number', () => {
  const result = sample('intreo');
  assert.equal(result.sender.id, 'dsp');
  assert.equal(result.kind.id, 'meeting');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-22', '09:30']]);
  assert.match(stepText(result), /Write the PPS number 7654321W on every reply\./);
  assert.deepEqual(buildReplies(result).map((reply) => reply.id), ['reschedule']);
});

test('samples are detected as Irish letters without picking the country', () => {
  for (const id of ['revenue', 'intreo']) assert.equal(run(sampleText('ie', id, TODAY)).country.id, 'ie');
  assert.equal(run(sampleText('uk', 'hmrc', TODAY)).country.id, 'uk');
});

test('fixed charge notice: the first amount, 28 days, no payment plan', () => {
  const result = run(`An Garda Síochána
Fixed Charge Processing Office
Date: 8 October 2026
Notice number: 1234567890
Fixed Charge Notice — Speeding
The vehicle was detected at 72 km/h in a 50 km/h zone on 1 October 2026 at 14:22.
Fixed charge: €160.00. Pay within 28 days of the date of this notice. If you do not pay within 28 days, the fixed charge increases to €240.00 for a further 28 days.`);
  assert.equal(result.kind.id, 'fixed-charge');
  assert.equal(result.money.toPay.amount, 160);
  assert.deepEqual(dates(result), [['payment', '2026-11-05']]);
  assert.deepEqual(buildReplies(result).map((reply) => reply.id), []);
});

test('social welfare decision: 21 days and the appeal letter', () => {
  const result = run(`Department of Social Protection
Date: 6 October 2026
PPS Number: 1234567T
The deciding officer has decided that your Jobseeker's Allowance will be paid at a reduced rate from 15 October 2026.
If you are not satisfied with this decision, you can ask for a review or appeal to the Social Welfare Appeals Office within 21 days of the date of this letter.`);
  assert.equal(result.kind.id, 'welfare-decision');
  assert.deepEqual(dates(result), [['start', '2026-10-15'], ['objection', '2026-10-27']]);
  const replies = buildReplies(result);
  assert.equal(replies[0].id, 'welfare-appeal');
  assert.match(replies[0].local, /Social Welfare Appeals Office/);
});
