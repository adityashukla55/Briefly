import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NOTICES, TERMS, applyRule, cancelRule, lastDayToCancel, noticeById, planCancel } from '../web/src/cancel.js';
import { COUNTRIES, countryById } from '../web/src/countries/index.js';
import { cancelLetter } from '../web/src/replies.js';

const month = noticeById('1m');
const threeMonths = noticeById('3m');
const twoWeeks = noticeById('14d');

test('finds the last day the company must get the cancellation', () => {
  assert.equal(lastDayToCancel('2026-03-14', month), '2026-02-14');
  assert.equal(lastDayToCancel('2026-12-31', threeMonths), '2026-09-30');
  assert.equal(lastDayToCancel('2026-06-30', threeMonths), '2026-03-31');
  assert.equal(lastDayToCancel('2026-03-14', twoWeeks), '2026-02-28');
  assert.equal(lastDayToCancel('2026-03-14', noticeById('none')), '2026-03-14');
});

test('ends a contract at the end of the minimum term when there is time', () => {
  const plan = planCancel({ start: '2024-11-15', term: 24, notice: month, renewal: 'open', today: '2026-10-14' });
  assert.equal(plan.ends, '2026-11-14');
  assert.equal(plan.sendBy, '2026-10-14');
  assert.equal(plan.daysLeft, 0);
  assert.equal(plan.open, false);
  assert.equal(plan.missedEnd, null);
});

test('after the minimum term, an open contract ends one notice period from today', () => {
  const plan = planCancel({ start: '2023-01-10', term: 24, notice: month, renewal: 'open', today: '2026-10-14' });
  assert.equal(plan.open, true);
  assert.equal(plan.sendBy, '2026-10-14');
  assert.equal(plan.ends, '2026-11-14');
  assert.equal(plan.missedEnd, '2025-01-09');
});

test('a contract that renews for a year moves to the next end date', () => {
  const plan = planCancel({ start: '2024-01-01', term: 12, notice: threeMonths, renewal: 'year', today: '2026-10-14' });
  assert.equal(plan.ends, '2027-12-31');
  assert.equal(plan.sendBy, '2027-09-30');
  assert.equal(plan.missedEnd, '2024-12-31');
  assert.equal(plan.nextEnd, '2028-12-31');
});

test('a contract that renews for the same time uses the minimum term again', () => {
  const plan = planCancel({ start: '2026-01-01', term: 6, notice: month, renewal: 'same', today: '2026-06-15' });
  assert.equal(plan.ends, '2026-12-31');
  assert.equal(plan.sendBy, '2026-11-30');
  assert.equal(plan.nextEnd, '2027-06-30');
});

test('a contract with no minimum term ends one notice period from today', () => {
  const plan = planCancel({ start: '2025-05-01', term: 0, notice: noticeById('30d'), renewal: 'open', today: '2026-10-14' });
  assert.equal(plan.open, true);
  assert.equal(plan.ends, '2026-11-13');
});

function ruleFor(id, input) {
  return cancelRule({ country: countryById(id), today: '2026-10-14', term: 12, ...input });
}

test('suggests the German rule for new contracts and for phone contracts', () => {
  const de = countryById('de');
  assert.equal(ruleFor('de', { start: '2023-05-01', notice: threeMonths, renewal: 'year' }), de.cancelRules[0]);
  assert.equal(ruleFor('de', { start: '2020-05-01', notice: month, renewal: 'year' }), de.cancelRules[1]);
  assert.equal(ruleFor('de', { start: '2023-05-01', notice: month, renewal: 'open' }), null);
  assert.equal(ruleFor('de', { start: '2020-05-01', notice: threeMonths, renewal: 'open' }), null);
  assert.equal(ruleFor('de', { start: '', notice: threeMonths, renewal: 'year' }), null);
  assert.equal(ruleFor('de', { start: '2023-05-01', term: 0, notice: month, renewal: 'year' }), null);
});

test('using the German rule ends the contract one month after the minimum term', () => {
  const rule = ruleFor('de', { start: '2023-05-01', notice: threeMonths, renewal: 'year' });
  assert.deepEqual(applyRule(rule, { term: 24, notice: threeMonths }), { term: 24, notice: '1m', renewal: 'open' });
  const phone = ruleFor('de', { start: '2020-05-01', notice: threeMonths, renewal: 'year' });
  assert.deepEqual(applyRule(phone, { term: 24, notice: threeMonths }), { term: 24, notice: '3m', renewal: 'open' });
});

test('Dutch rule: after the first term, cancel any time with 1 month’s notice', () => {
  const rule = ruleFor('nl', { start: '2020-01-01', notice: threeMonths, renewal: 'year' });
  assert.equal(rule, countryById('nl').cancelRules[0]);
  assert.equal(ruleFor('nl', { start: '2010-06-01', notice: threeMonths, renewal: 'year' }), null);
  const next = applyRule(rule, { term: 12, notice: threeMonths });
  assert.deepEqual(next, { term: 12, notice: '1m', renewal: 'open' });
  const plan = planCancel({ start: '2020-01-01', term: next.term, notice: noticeById(next.notice), renewal: next.renewal, today: '2026-10-14' });
  assert.equal(plan.open, true);
  assert.equal(plan.ends, '2026-11-14');
});

test('French insurance rule only shows after the first year', () => {
  assert.equal(ruleFor('fr', { start: '2026-01-01', notice: noticeById('2m'), renewal: 'year' }), null);
  const rule = ruleFor('fr', { start: '2024-03-01', notice: noticeById('2m'), renewal: 'year' });
  assert.equal(rule, countryById('fr').cancelRules[0]);
  assert.deepEqual(applyRule(rule, { term: 12, notice: noticeById('2m') }), { term: 12, notice: '1m', renewal: 'open' });
});

test('Belgian phone rule: free to cancel after 6 months', () => {
  assert.equal(ruleFor('be', { start: '2026-06-01', term: 24, notice: month, renewal: 'same' }), null);
  const rule = ruleFor('be', { start: '2025-01-01', term: 24, notice: month, renewal: 'same' });
  assert.equal(rule, countryById('be').cancelRules[0]);
  const next = applyRule(rule, { term: 24, notice: month });
  assert.deepEqual(next, { term: 6, notice: '1m', renewal: 'open' });
  const plan = planCancel({ start: '2025-01-01', term: next.term, notice: noticeById(next.notice), renewal: next.renewal, today: '2026-10-14' });
  assert.equal(plan.open, true);
  assert.equal(plan.ends, '2026-11-14');
});

test('Italian phone rule: cancel any time with at most 30 days’ notice', () => {
  const rule = ruleFor('it', { start: '2026-02-01', term: 24, notice: threeMonths, renewal: 'same' });
  const next = applyRule(rule, { term: 24, notice: threeMonths });
  assert.deepEqual(next, { term: 0, notice: '30d', renewal: 'open' });
  const plan = planCancel({ start: '2026-02-01', term: next.term, notice: noticeById(next.notice), renewal: next.renewal, today: '2026-10-14' });
  assert.equal(plan.ends, '2026-11-13');
  assert.equal(ruleFor('it', { start: '2026-02-01', term: 0, notice: twoWeeks, renewal: 'open' }), null);
});

test('Swedish rule lowers a long notice period to 1 month', () => {
  assert.equal(ruleFor('se', { start: '2018-01-01', notice: threeMonths, renewal: 'open' }), countryById('se').cancelRules[0]);
  assert.equal(ruleFor('se', { start: '2013-01-01', notice: threeMonths, renewal: 'open' }), null);
});

test('Canadian rule: phone and internet end the day the provider is told', () => {
  const rule = ruleFor('ca', { start: '2026-02-01', term: 24, notice: noticeById('30d'), renewal: 'open' });
  const next = applyRule(rule, { term: 24, notice: noticeById('30d') });
  assert.deepEqual(next, { term: 0, notice: 'none', renewal: 'open' });
  const plan = planCancel({ start: '2026-02-01', term: next.term, notice: noticeById(next.notice), renewal: next.renewal, today: '2026-10-14' });
  assert.equal(plan.ends, '2026-10-14');
});

test('countries with local cancel tips', () => {
  const covered = COUNTRIES.filter((country) => country.cancelTips?.length).map((country) => country.id);
  assert.deepEqual(covered, ['de', 'at', 'ch', 'fr', 'es', 'pt', 'it', 'nl', 'be', 'pl', 'se', 'dk', 'uk', 'ie', 'us', 'ca']);
  const withRule = COUNTRIES.filter((country) => country.cancelRules?.length).map((country) => country.id);
  assert.deepEqual(withRule, ['de', 'fr', 'it', 'nl', 'be', 'se', 'ca']);
});

test('every law rule and tip in the country files is complete', () => {
  const notices = new Set(NOTICES.map((notice) => notice.id));
  for (const country of COUNTRIES) {
    for (const tip of country.cancelTips ?? []) {
      assert.equal(typeof tip, 'string', country.id);
      assert.ok(tip.length > 20 && tip.length < 260, `${country.id}: ${tip}`);
    }
    for (const rule of country.cancelRules ?? []) {
      assert.ok(rule.text?.length > 20, country.id);
      if (rule.notice) assert.ok(notices.has(rule.notice), `${country.id} notice ${rule.notice}`);
      if (rule.term !== undefined) assert.ok(TERMS.includes(rule.term), `${country.id} term ${rule.term}`);
      if (rule.after) assert.ok(Number.isInteger(rule.after) && rule.after > 0, `${country.id} after ${rule.after}`);
      if (rule.since) assert.match(rule.since, /^\d{4}-\d{2}-\d{2}$/, country.id);
    }
  }
});

test('writes the cancellation letter in the language of the country', () => {
  const letter = cancelLetter({ country: countryById('de'), company: 'Fitness Plus GmbH', number: 'K-4471', ends: '2026-11-14', today: '2026-10-14' });
  assert.match(letter, /^\[Ihr Vorname Nachname\]/);
  assert.match(letter, /\nFitness Plus GmbH\n\[Adresse der Firma\]\n/);
  assert.match(letter, /Kündigung meines Vertrags\nKundennummer: K-4471/);
  assert.match(letter, /fristgerecht zum 14\.11\.2026/);
  assert.match(letter, /\[Ihr Ort\], 14\.10\.2026/);

  const empty = cancelLetter({ country: countryById('us'), ends: '2026-11-14', today: '2026-10-14' });
  assert.match(empty, /\[Name of the company\]/);
  assert.match(empty, /Account number: \[Account number\]/);
  assert.match(empty, /end it on 11\/14\/2026/);
});

test('every country can write a cancellation letter', () => {
  for (const country of COUNTRIES) {
    const letter = cancelLetter({ country, company: 'Example', ends: '2026-11-14', today: '2026-10-14' });
    assert.ok(letter.length > 200, country.id);
    assert.ok(!letter.includes('undefined'), country.id);
  }
});
