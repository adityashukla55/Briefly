import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const at = countryById('at');
const de = LANGUAGES.de;

const dateList = (result) => result.dates.map((date) => [date.type, date.iso]);

test('at tax assessment: sender, kind, dates, money and Beschwerde', () => {
  const result = analyze(sampleText('at', 'tax', TODAY), { today: TODAY, country: 'at' });
  assert.equal(result.sender.id, 'finanzamt');
  assert.equal(result.kind.id, 'steuerbescheid');
  assert.equal(result.kind.type, 'tax-assessment');
  assert.equal(result.letterDate, '2026-10-10');
  assert.deepEqual(dateList(result), [['objection', '2026-11-13'], ['payment', '2026-11-16']]);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.estimated, true);
  assert.equal(objection.period, '1 month');
  assert.equal(objection.label, 'Last day to object (Beschwerde)');
  assert.equal(result.money.toPay.amount, 638);
  assert.equal(result.money.toPay.currency, 'EUR');
  assert.equal(result.payment.iban, 'AT61 1904 3002 3457 3201');
  assert.equal(result.payment.recipient, 'Finanzamt Österreich');
  assert.equal(result.payment.reference, '031234567 E 2025');
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [['Steuernummer', '03 123/4567'], ['Zahlungsreferenz', '031234567 E 2025']]);
  assert.equal(result.objection, 'Beschwerde');
  assert.ok(result.terms.some((term) => term.term === 'Beschwerde'));
});

test('at tax assessment: steps and replies', () => {
  const result = analyze(sampleText('at', 'tax', TODAY), { today: TODAY, country: 'at' });
  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Pay €638\.00 by Mon, 16 Nov 2026 to the account AT61 1904 3002 3457 3201/);
  assert.match(steps, /Aussetzung der Einhebung/);
  assert.match(steps, /send a written objection \(Beschwerde\) by Fri, 13 Nov 2026 \(estimated\)/);
  assert.match(steps, /tax number \(Steuernummer\) 03 123\/4567/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'suspend-payment', 'more-time-objection', 'instalments']);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.match(objection.local, /Beschwerde gegen den Bescheid vom 10\.10\.2026/);
  assert.match(objection.local, /erhebe ich innerhalb offener Frist Beschwerde/);
  assert.match(objection.local, /Steuernummer: 03 123\/4567/);
  const pause = replies.find((reply) => reply.id === 'suspend-payment');
  assert.match(pause.local, /Aussetzung der Einhebung von €\s638,00/);
  assert.match(replies.find((reply) => reply.id === 'more-time-objection').local, /Frist für eine Beschwerde gegen den Bescheid vom 10\.10\.2026 bis \[neues Datum\] zu verlängern/);
  assert.match(objection.when, /a Beschwerde needs them/);
});

test('at Strafverfügung: fine, Einspruch within 2 weeks, no false appointment', () => {
  const result = analyze(sampleText('at', 'fine', TODAY), { today: TODAY, country: 'at' });
  assert.equal(result.sender.id, 'polizei');
  assert.equal(result.kind.id, 'strafverfuegung');
  assert.equal(result.kind.type, 'fine');
  assert.equal(result.letterDate, '2026-10-08');
  assert.deepEqual(dateList(result), [['objection', '2026-10-25']]);
  assert.equal(result.dates[0].period, '2 weeks');
  assert.equal(result.money.toPay.amount, 110);
  assert.equal(result.money.toPay.currency, 'EUR');
  assert.equal(result.payment.iban, 'AT61 1904 3002 3457 3201');
  assert.equal(result.payment.reference, 'VStV/926001234567/2026');
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [['Geschäftszahl', 'VStV/926001234567/2026']]);
  assert.equal(result.objection, 'Einspruch');
  assert.equal(result.urgency, 'high');

  const steps = buildSteps(result);
  assert.equal(steps[0].tone, 'urgent');
  assert.match(steps.map((step) => step.text).join(' '), /send a written objection \(Einspruch\) by Sun, 25 Oct 2026 \(estimated\)/);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments']);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.match(objection.title, /Einspruch/);
  assert.match(objection.local, /Einspruch gegen Ihr Schreiben vom 08\.10\.2026/);
  assert.match(objection.local, /Geschäftszahl: VStV\/926001234567\/2026/);
});

test('Austrian samples are detected as Austria, German samples stay German', () => {
  for (const id of ['tax', 'fine']) {
    assert.equal(analyze(sampleText('at', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'at', id);
  }
  for (const id of ['tax', 'jobcenter', 'fee']) {
    assert.equal(analyze(sampleText('de', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'de', id);
  }
  assert.equal(analyze('Hauptzollamt\nVollstreckungsankündigung\nOffene Forderung: 1.250,00 €', { today: TODAY }).country.id, 'de');
});

test('at AMS invitation: appointment with time', () => {
  const text = 'Arbeitsmarktservice Wien\nAMS Geschäftsstelle Musterstraße\nSozialversicherungsnummer: 1234 010190\nDatum: 09.10.2026\n\nEinladung\n\nSehr geehrte Frau Beispiel,\nbitte kommen Sie am 21.10.2026 um 09:30 Uhr zu einem Beratungsgespräch in die AMS Geschäftsstelle, Zimmer 214.\nWenn Sie ohne wichtigen Grund nicht zu diesem Termin kommen, wird die Auszahlung Ihres Arbeitslosengeldes eingestellt.';
  const result = analyze(text, { today: TODAY, preferred: 'de' });
  assert.equal(result.country.id, 'at');
  assert.equal(result.sender.id, 'ams');
  assert.equal(result.kind.id, 'termin');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-21', '09:30']]);
  assert.ok(result.references.some((reference) => reference.value === '1234 010190'));
  assert.ok(buildReplies(result).some((reply) => reply.id === 'reschedule'));
});

test('at Anonymverfügung: pay, no objection reply', () => {
  const text = 'Landespolizeidirektion Wien\nDatum: 07.10.2026\n\nANONYMVERFÜGUNG\nMit dem Kraftfahrzeug mit dem Kennzeichen W-12345X wurde die erlaubte Höchstgeschwindigkeit überschritten. Der Lenker ist der Behörde nicht bekannt.\nStrafbetrag: € 50,00\nDie Anonymverfügung wird gegenstandslos, wenn der Strafbetrag nicht binnen vier Wochen mit dem beiliegenden Zahlschein eingezahlt wird.\nIdentifikationsnummer: 1234 5678 9012';
  const result = analyze(text, { today: TODAY, country: 'at' });
  assert.equal(result.kind.id, 'anonymverfuegung');
  assert.equal(result.kind.type, 'fine');
  assert.equal(result.kind.objection, false);
  assert.equal(result.money.toPay.amount, 50);
  assert.equal(result.objection, null);
  assert.ok(result.references.some((reference) => reference.local === 'Identifikationsnummer' && reference.payment));
  const replies = buildReplies(result).map((reply) => reply.id);
  assert.ok(!replies.includes('objection'));
  assert.ok(!replies.includes('more-time'));
  assert.match(buildSteps(result)[0].text, /4 weeks from the date on the letter/);
});

test('at court letters: Zahlungsbefehl, Exekution and Mandatsbescheid', () => {
  const order = analyze('Bezirksgericht Innere Stadt Wien\nGZ: 23 C 456/26m\nDatum: 05.10.2026\n\nZahlungsbefehl\nSie können gegen diesen Zahlungsbefehl binnen vier Wochen Einspruch erheben.', { today: TODAY, country: 'at' });
  assert.equal(order.sender.id, 'gericht');
  assert.equal(order.kind.id, 'zahlungsbefehl');
  assert.equal(order.kind.type, 'court-order');
  assert.equal(order.objection, 'Einspruch');
  assert.deepEqual(dateList(order), [['objection', '2026-11-05']]);
  assert.ok(order.references.some((reference) => reference.value === '23 C 456/26m'));

  const enforcement = analyze('Bezirksgericht Favoriten\nAktenzeichen: 12 E 3456/26k\nDatum: 06.10.2026\nExekutionsbewilligung\nGegen Sie wird die Gehaltsexekution bewilligt.\nForderung: € 1.250,00 samt Zinsen und Kosten.', { today: TODAY, country: 'at' });
  assert.equal(enforcement.kind.id, 'exekution');
  assert.equal(enforcement.kind.type, 'enforcement');
  assert.equal(enforcement.urgency, 'high');
  assert.equal(enforcement.money.toPay.amount, 1250);

  const mandate = analyze('Bezirkshauptmannschaft Mödling\nDatum: 09.10.2026\nMandatsbescheid\nIhre Lenkberechtigung wird entzogen.\nRechtsmittelbelehrung\nGegen diesen Bescheid können Sie binnen zwei Wochen nach Zustellung Vorstellung erheben.', { today: TODAY, country: 'at' });
  assert.equal(mandate.sender.id, 'magistrat');
  assert.equal(mandate.objection, 'Vorstellung');
  assert.deepEqual(dateList(mandate), [['objection', '2026-10-26']]);
});

test('at objection word: most specific first, Beschwerde as the default', () => {
  const word = (text) => analyze(text, { today: TODAY, country: 'at' }).objection;
  assert.equal(word('Ihr Einspruch vom 01.09.2026 wurde geprüft. Gegen dieses Straferkenntnis können Sie binnen vier Wochen Beschwerde erheben.'), 'Beschwerde');
  assert.equal(word('Gegen diese Strafverfügung können Sie binnen zwei Wochen Einspruch erheben.'), 'Einspruch');
  assert.equal(word('Einladung zu einem Vorstellungsgespräch am 21.10.2026.'), null);
  assert.equal(at.objection[0].word, 'Beschwerde');
});

test('at other letters: MA 35, Familienbeihilfe and ORF-Beitrag', () => {
  const permit = analyze('Magistrat der Stadt Wien\nMagistratsabteilung 35\nGZ: MA35-9/1234567-2026\nDatum: 08.10.2026\nVerständigung vom Ergebnis der Beweisaufnahme (Parteiengehör)\nSie haben die Erteilung eines Aufenthaltstitels Rot-Weiß-Rot – Karte plus beantragt.\nSie können binnen zwei Wochen ab Zustellung eine schriftliche Stellungnahme abgeben.', { today: TODAY, preferred: 'de' });
  assert.equal(permit.country.id, 'at');
  assert.equal(permit.sender.id, 'ma35');
  assert.equal(permit.kind.type, 'documents');
  assert.deepEqual(dateList(permit), [['deadline', '2026-10-25']]);

  const family = analyze('Finanzamt Österreich\nDatum: 06.10.2026\nÜberprüfung des Anspruchs auf Familienbeihilfe\nBitte übermitteln Sie uns bis 06.11.2026 eine Schulbesuchsbestätigung. Sonst kann die Familienbeihilfe eingestellt werden.', { today: TODAY, country: 'at' });
  assert.equal(family.sender.id, 'familienbeihilfe');
  assert.equal(family.kind.id, 'unterlagen');
  assert.deepEqual(dateList(family), [['deadline', '2026-11-06']]);

  const fee = analyze('ORF-Beitrags Service GmbH\nBeitragsnummer: 123 456 789\nDatum: 05.10.2026\nZahlungserinnerung\nFür den ORF-Beitrag ist ein offener Betrag von 45,90 € noch nicht bezahlt.\nBitte zahlen Sie bis 20.10.2026.', { today: TODAY, country: 'at' });
  assert.equal(fee.sender.id, 'orf');
  assert.equal(fee.kind.id, 'mahnung');
  assert.equal(fee.money.toPay.amount, 45.9);
  assert.deepEqual(dateList(fee), [['payment', '2026-10-20']]);
});

test('reads Austrian dates like “15. Jänner 2027” and “3. Feber 2027”', () => {
  const dates = findDates('Fällig am 15. Jänner 2027, Termin am 3. Feber 2027 um 10:15 Uhr, Datum: 1.12.2026', de);
  assert.deepEqual(dates.map((date) => date.iso), ['2027-01-15', '2027-02-03', '2026-12-01']);
  assert.equal(dates[1].time, '10:15');
});

test('reads Austrian deadline phrases', () => {
  const periods = (text) => findPeriods(text, de).map((period) => [period.amount, period.unit, period.from]);
  assert.deepEqual(periods('binnen vier Wochen nach Zustellung'), [[4, 'week', 'zustellung']]);
  assert.deepEqual(periods('innerhalb eines Monats nach Zustellung dieses Bescheides'), [[1, 'month', 'zustellung']]);
  assert.deepEqual(periods('binnen zwei Wochen ab Zustellung'), [[2, 'week', 'zustellung']]);
  assert.deepEqual(periods('binnen 14 Tagen'), [[14, 'day', null]]);
  assert.deepEqual(periods('binnen offener Frist'), []);
});

test('reads Austrian amounts', () => {
  const amounts = (text) => findMoney(text, at).items.map((item) => item.amount);
  assert.deepEqual(amounts('Strafbetrag: € 1.234,56'), [1234.56]);
  assert.deepEqual(amounts('Geldstrafe EUR 90,--'), [90]);
  assert.deepEqual(amounts('Nachzahlung: 638,00 €'), [638]);
  assert.deepEqual(amounts('Gesamtbetrag € 110,-'), [110]);
  assert.deepEqual(amounts('50 km/h um 23 km/h überschritten'), []);
});

test('at pack shape', () => {
  assert.equal(isValidIban('AT61 1904 3002 3457 3201'), true);
  assert.ok(at.senders.length >= 12 && at.senders.length <= 16);
  assert.ok(at.kinds.length >= 12 && at.kinds.length <= 16);
  assert.ok(at.references.length >= 8 && at.references.length <= 12);
  assert.ok(at.glossary.length >= 35 && at.glossary.length <= 50);
  assert.equal(at.samples.length, 2);
  const types = new Set(['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision']);
  for (const kind of at.kinds) assert.ok(types.has(kind.type), kind.id);
  for (const list of [at.senders, at.glossary]) {
    const slugs = list.map((item) => item.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9-]+$/);
  }
  assert.ok(at.references.some((reference) => reference.payment));
});
