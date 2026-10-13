import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze } from '../web/src/analyze.js';
import { findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';

test('French deadlines written as “d’un mois” and “deux (2) mois”', () => {
  const periods = (text) => findPeriods(text, LANGUAGES.fr).map((period) => [period.amount, period.unit, period.from]);
  assert.deepEqual(periods('dans un délai d’un mois à compter de la date de notification'), [[1, 'month', 'notification']]);
  assert.deepEqual(periods('dans le délai d\'un mois'), [[1, 'month', null]]);
  assert.deepEqual(periods('dans un délai de deux (2) mois à compter de la réception'), [[2, 'month', 'réception']]);
});

test('French “à compter du” dates are start dates, and deadlines count from delivery', () => {
  const result = analyze('CAF de Paris\nParis, le 10/10/2026\nVos droits sont ouverts à compter du 01/11/2026.\nMadame,\nvous pouvez contester dans un délai d’un mois à compter de la date de notification.', { country: 'fr', today: '2026-10-13' });
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso]), [['start', '2026-11-01'], ['objection', '2026-11-13']]);
});

test('French payment reference needs a payment label', () => {
  const result = analyze('Référence de l’avis : 26 75 123 456 789\nIBAN : FR76 3000 6000 0112 3456 7890 189\nRéférence de paiement : 2675123456', { country: 'fr', today: '2026-10-13' });
  assert.equal(result.payment.reference, '2675123456');
});

test('Italian deadlines with forty days, numbers in brackets and “perentorio”', () => {
  const periods = (text) => findPeriods(text, LANGUAGES.it).map((period) => [period.amount, period.unit]);
  assert.deepEqual(periods('entro quaranta giorni dalla notifica'), [[40, 'day']]);
  assert.deepEqual(periods('entro 60 (sessanta) giorni dalla notifica'), [[60, 'day']]);
  assert.deepEqual(periods('entro il termine perentorio di 60 giorni'), [[60, 'day']]);
});

test('Italian appointments written with “del” keep their date', () => {
  const result = analyze('Questura di Roma\nRoma, 10/10/2026\nGentile Signora,\nla informiamo dell’appuntamento del 21/10/2026 alle ore 9:30.', { country: 'it', today: '2026-10-13' });
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-21', '09:30']]);
});

test('a short payment window next to an appeal clause is not taken as the appeal deadline', () => {
  const result = analyze('Polizia Locale\nRoma, 10/10/2026\nVerbale di contestazione\nPagamento in misura ridotta entro 5 giorni dalla notifica. Ricorso al Prefetto entro 60 giorni dalla notifica.', { country: 'it', today: '2026-10-13' });
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.period, '60 days');
  assert.equal(result.dates.find((date) => date.type === 'payment').period, '5 days');
});

test('Italian references written as “n.”', () => {
  const result = analyze('Verbale n. 123456/2026\nProt. n. 7890/A', { country: 'it', today: '2026-10-13' });
  assert.ok(result.references.some((reference) => reference.value.startsWith('123456')));
});

test('Spanish plain “días” are working days unless they say “naturales”', () => {
  const units = (text) => findPeriods(text, LANGUAGES.es).map((period) => period.unit);
  assert.deepEqual(units('en el plazo de veinte días'), ['workday']);
  assert.deepEqual(units('en el plazo de veinte días naturales'), ['day']);
  assert.deepEqual(units('en el plazo de diez días hábiles'), ['workday']);
  assert.deepEqual(findPeriods('innerhalb von 14 Tagen', LANGUAGES.de).map((period) => period.unit), ['day']);
});

test('Spanish direct-debit date is a payment date, not the letter date', () => {
  const result = analyze('Ayuntamiento de Madrid\nMadrid, 10/10/2026\nFecha de cargo: 20/10/2026\nImporte: 120,00 €', { country: 'es', today: '2026-10-13' });
  assert.equal(result.letterDate, '2026-10-10');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso]), [['payment', '2026-10-20']]);
});

test('Austrian payment order: pay within 14 days, object within 4 weeks', () => {
  const result = analyze('Bezirksgericht Wien\nWien, 08.10.2026\nZahlungsbefehl\nSie sind schuldig, binnen 14 Tagen 1.200,00 € zu zahlen oder gegen diesen Zahlungsbefehl binnen vier Wochen Einspruch zu erheben.', { country: 'at', today: '2026-10-13' });
  assert.deepEqual(result.dates.map((date) => [date.type, date.period]).sort(), [['objection', '4 weeks'], ['payment', '14 days']]);
});

test('time of an offence is not an appointment', () => {
  const result = analyze('Landespolizeidirektion Wien\nWien, 08.10.2026\nTatzeit: 02.09.2026, 14:35 Uhr', { country: 'at', today: '2026-10-13' });
  assert.equal(result.dates.some((date) => date.type === 'appointment'), false);
});

test('“Nachforderung” is the total to pay, even when the amount appears twice', () => {
  const result = analyze('Finanzamt Österreich\nWien, 08.10.2026\nEinkommensteuer 4.598,00 €\nAbgabennachforderung 638,00 €\nDie Abgabennachforderung von 638,00 € ist bis 16.11.2026 zu entrichten.', { country: 'at', today: '2026-10-13' });
  assert.equal(result.money.toPay.amount, 638);
  assert.equal(result.dates.find((date) => date.iso === '2026-11-16').type, 'payment');
});
