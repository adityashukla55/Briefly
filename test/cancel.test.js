import assert from 'node:assert/strict';
import { test } from 'node:test';
import { germanRule, lastDayToCancel, noticeById, planCancel } from '../web/src/cancel.js';
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

test('suggests the German rule for new contracts and for phone contracts', () => {
  assert.equal(germanRule({ countryId: 'de', start: '2023-05-01', notice: threeMonths, renewal: 'year' }), 'new');
  assert.equal(germanRule({ countryId: 'de', start: '2020-05-01', notice: month, renewal: 'year' }), 'phone');
  assert.equal(germanRule({ countryId: 'de', start: '2023-05-01', notice: month, renewal: 'open' }), null);
  assert.equal(germanRule({ countryId: 'de', start: '2020-05-01', notice: threeMonths, renewal: 'open' }), null);
  assert.equal(germanRule({ countryId: 'fr', start: '2023-05-01', notice: threeMonths, renewal: 'year' }), null);
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
