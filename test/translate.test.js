import assert from 'node:assert/strict';
import { test } from 'node:test';
import { afterTranslation, beforeTranslation as before, fixedPhrase as fixed, shouldTranslate, toParagraphs } from '../web/src/translate.js';
import { countryById } from '../web/src/countries/index.js';
import { LANGUAGES } from '../web/src/languages/index.js';

const beforeTranslation = (line) => before(line, countryById('de'));
const fixedPhrase = (line) => fixed(line, LANGUAGES.de);

test('protects amounts and deadlines before translation', () => {
  assert.equal(beforeTranslation('Abzüglich Lohnsteuer: 4.400,00 €'), 'Abzüglich Lohnsteuer: EUR 4400.00');
  assert.equal(beforeTranslation('zahlen Sie EUR 55,08 bis zum 11.11.2026'), 'zahlen Sie EUR 55.08 spätestens am 11.11.2026');
  assert.equal(beforeTranslation('vom 01.07.2026 bis 30.09.2026'), 'vom 01.07.2026 bis 30.09.2026');
  assert.equal(beforeTranslation('Postfach 12 34 · 09001 Chemnitz'), 'Postfach 12 34 - 09001 Chemnitz');
  assert.equal(beforeTranslation('§ 122 AO'), 'Paragraf 122 AO');
  assert.equal(beforeTranslation('Raum 2.14'), 'Raum 2.14');
});

test('formats amounts and dates for English readers after translation', () => {
  assert.equal(afterTranslation('Pay €4812.00 no later than 11.11.2026.'), 'Pay €4,812.00 no later than 11 Nov 2026.');
  assert.equal(afterTranslation('Room 2.14'), 'Room 2.14');
});

test('keeps short lines apart and joins wrapped sentences', () => {
  const paragraphs = toParagraphs('Finanzamt Chemnitz\nPostfach 12 34\n\ndie Einkommensteuer für das Jahr 2025 wird auf einen Betrag\nfestgesetzt, der unten steht.');
  assert.deepEqual(paragraphs, [
    'Finanzamt Chemnitz\nPostfach 12 34',
    'die Einkommensteuer für das Jahr 2025 wird auf einen Betrag festgesetzt, der unten steht.',
  ]);
});

test('keeps names and addresses above the greeting in German', () => {
  const greeting = 4;
  assert.equal(shouldTranslate(1, 'Erika Muster', greeting), false);
  assert.equal(shouldTranslate(2, 'Kundennummer: 123D456789', greeting), true);
  assert.equal(shouldTranslate(3, 'Einladung zum Meldetermin', greeting), true);
  assert.equal(shouldTranslate(5, 'Bitte bringen Sie mit', greeting), true);
  assert.equal(shouldTranslate(0, 'Erika Muster', -1), true);
  assert.equal(shouldTranslate(6, '04109 12', greeting), false);
});

test('greetings and closings use fixed English phrases', () => {
  assert.equal(fixedPhrase('Sehr geehrte Frau Muster,'), 'Dear Ms Muster,');
  assert.equal(fixedPhrase('Sehr geehrter Herr Beispiel,'), 'Dear Mr Beispiel,');
  assert.equal(fixedPhrase('Sehr geehrte Damen und Herren,'), 'Dear Sir or Madam,');
  assert.equal(fixedPhrase('Mit freundlichen Grüßen'), 'Kind regards');
  assert.equal(fixedPhrase('Bitte zahlen Sie'), null);
});

test('amounts come back as euros or francs after translation, in any word order', () => {
  assert.equal(afterTranslation('Pay EUR 4812.00 by 11.11.2026.'), 'Pay €4,812.00 by 11 Nov 2026.');
  assert.equal(afterTranslation('Amount outstanding: 1234.56 EUR'), 'Amount outstanding: €1,234.56');
  assert.equal(afterTranslation('Total: CHF 1240.50'), 'Total: CHF 1,240.50');
  assert.equal(afterTranslation('Pay by 20/11/2026'), 'Pay by 20 Nov 2026');
});

test('French, Spanish and Italian amounts are protected before translation', () => {
  assert.equal(before('Montant restant dû : 1 234,56 €', countryById('fr')), 'Montant restant dû : EUR 1234.56');
  assert.equal(before('Importe a ingresar: 1.234,56 euros', countryById('es')), 'Importe a ingresar: EUR 1234.56');
  assert.equal(before('Importo totale: € 1.234,56', countryById('it')), 'Importo totale: EUR 1234.56');
  assert.equal(before('Betrag: CHF 1\'240.50', countryById('ch')), 'Betrag: CHF 1240.50');
});
