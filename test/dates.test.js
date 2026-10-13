import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addMonths, addPeriod, addWorkdays, daysBetween, findDates, findPeriods, toIso } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';

const de = LANGUAGES.de;

test('reads numeric and written German dates', () => {
  const dates = findDates('Datum: 03.11.2026, bis zum 1. Dezember 2026 und am 5.1.27 um 9:30 Uhr', de);
  assert.deepEqual(dates.map((date) => date.iso), ['2026-11-03', '2026-12-01', '2027-01-05']);
  assert.equal(dates[2].time, '09:30');
});

test('ignores amounts, IBANs and impossible dates', () => {
  const dates = findDates('Betrag 1.234,56 € IBAN DE89 3704 0044 0532 0130 00 am 31.02.2026 Version 1.2.3', de);
  assert.equal(dates.length, 0);
});

test('rejects invalid calendar dates', () => {
  assert.equal(toIso(2026, 2, 30), null);
  assert.equal(toIso(2026, 13, 1), null);
  assert.equal(toIso(26, 3, 1), '2026-03-01');
});

test('adds months like German deadline rules', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-10-15', 1), '2026-11-15');
  assert.equal(daysBetween('2026-10-13', '2026-10-20'), 7);
});

test('finds periods like "innerhalb eines Monats nach Bekanntgabe"', () => {
  const [period] = findPeriods('Der Einspruch ist innerhalb eines Monats nach Bekanntgabe einzulegen.', de);
  assert.equal(period.amount, 1);
  assert.equal(period.unit, 'month');
  assert.equal(period.from, 'bekanntgabe');
  assert.equal(addPeriod('2026-10-14', period), '2026-11-14');

  const [weeks] = findPeriods('innerhalb von zwei Wochen ab Zustellung', de);
  assert.equal(weeks.amount, 2);
  assert.equal(weeks.unit, 'week');

  const [days] = findPeriods('binnen 14 Tagen', de);
  assert.equal(days.amount, 14);
  assert.equal(days.unit, 'day');
});

test('adds working days, skipping weekends', () => {
  assert.equal(addWorkdays('2026-10-16', 1), '2026-10-19');
  assert.equal(addWorkdays('2026-10-14', 10), '2026-10-28');
});

test('reads Swiss "innert" deadlines', () => {
  const [period] = findPeriods('Sie können innert 10 Tagen Rechtsvorschlag erheben.', de);
  assert.equal(period.amount, 10);
  assert.equal(period.unit, 'day');
});
