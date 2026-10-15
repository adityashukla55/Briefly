import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze } from '../web/src/analyze.js';
import { COUNTRIES, countryById } from '../web/src/countries/index.js';
import { findPrivate, readLayout } from '../web/src/redact.js';

const CHAR = 8;
const LINE = 20;
const HEIGHT = 14;

function page(text, { left = 10, top = 10, pitch = LINE } = {}) {
  const lines = [];
  text.split('\n').forEach((line, row) => {
    const words = [...line.matchAll(/\S+/g)].map((match) => ({
      text: match[0],
      x0: left + match.index * CHAR,
      x1: left + (match.index + match[0].length) * CHAR,
      y0: top + row * pitch,
      y1: top + row * pitch + HEIGHT,
    }));
    if (words.length) lines.push({ words });
  });
  return { width: 1200, height: top + text.split('\n').length * pitch + 20, lines };
}

function columns(left, right, gap = 60) {
  const a = page(left);
  const b = page(right, { left: 10 + gap * CHAR });
  const rows = new Map();
  for (const line of [...a.lines, ...b.lines]) {
    const key = line.words[0].y0;
    rows.set(key, [...(rows.get(key) ?? []), ...line.words]);
  }
  return { width: 1200, height: Math.max(a.height, b.height), lines: [...rows.entries()].sort(([x], [y]) => x - y).map(([, words]) => ({ words })) };
}

function covered(word, boxes, index = 0) {
  const x = (word.x0 + word.x1) / 2;
  const y = (word.y0 + word.y1) / 2;
  return boxes.some((box) => box.page === index && box.x0 <= x && box.x1 >= x && box.y0 <= y && box.y1 >= y);
}

function visible(pages, boxes) {
  return pages.map((item, index) => item.lines.map((line) => line.words.map((word) => (covered(word, boxes, index) ? '█' : word.text)).join(' ')).join('\n')).join('\n\n');
}

function wordsWhere(pages, boxes, hidden) {
  return new Set(pages.flatMap((item, index) => item.lines.flatMap((line) => line.words.filter((word) => covered(word, boxes, index) === hidden).map((word) => word.text))));
}

const hiddenWords = (pages, boxes) => wordsWhere(pages, boxes, true);

function check(text, countryId = 'de') {
  const pages = [page(text)];
  const boxes = findPrivate(pages, countryById(countryId));
  return { boxes, hidden: hiddenWords(pages, boxes), shown: wordsWhere(pages, boxes, false) };
}

const SAMPLES = {
  'de tax': { hidden: ['Herrn', 'Max', 'Beispiel', 'Musterstraße', '09111', 'DE89', '214/123/45678'], kept: ['Finanzamt', 'Chemnitz-Mitte', '412,00', 'Einkommensteuer', 'COBADEFFXXX'] },
  'de jobcenter': { hidden: ['Erika', 'Muster', 'Beispielweg', '05301//0012345', '123D456789'], kept: ['Jobcenter', 'Leipzig', '09:30', 'Schneider'] },
  'at fine': { hidden: ['Ana', 'Lindengasse', 'VStV/926001234567/2026'], kept: ['Landespolizeidirektion', '110,00', 'W-12345X'] },
  'ch betreibung': { hidden: ['Daniel', 'Mustergasse', '26012345'], kept: ['Betreibungsamt', 'Schuldner', 'Gläubiger', "1'240.50"] },
  'ch krankenkasse': { hidden: ['Anna', 'Lindenweg', '756.1234.5678.97', '801234567'], kept: ['Musterkasse', '406.40'] },
  'fr caf': { hidden: ['Madame', 'Ana', 'Exemplo', 'Lilas', '1234567'], kept: ['Caf', '234,56', 'Madame,'] },
  'fr prefecture': { hidden: ['Rahul', 'Tilleuls', '6901234567', '2026-069-012345'], kept: ['PRÉFECTURE', 'Monsieur,'] },
  'es tax': { hidden: ['Thomas', 'Muestra', 'X1234567L', '2026GRC28012345'], kept: ['Agencia', 'Tributaria', '1.234,56'] },
  'pt at': { hidden: ['João', 'Amostras,', '123456789'], kept: ['AUTORIDADE', '1.234,56'] },
  'it questura': { hidden: ['Daniel', 'SMPDNL88E21Z404M', 'immigrazione.bologna@pec.esempio.it', '26BO-0012345'], kept: ['QUESTURA', 'Bologna,'] },
  'nl tax': { hidden: ['S.', 'Voorbeeld', 'Voorbeeldstraat', '999990019'], kept: ['Belastingdienst', '09-10-2026', '1.234,56'] },
  'be tax': { hidden: ['Lotte', 'Voorbeeld', '85.07.30-033.28', 'BE68'], kept: ['FOD', 'Financiën'] },
  'pl tax': { hidden: ['Rahul', 'Przykład', 'Lipowa', '92031512345'], kept: ['Naczelnik', 'Warszawa-Mokotów'] },
  'se forsakringskassan': { hidden: ['Anna', 'Exempel', 'Exempelgatan', '850730-1234'], kept: ['Försäkringskassan', '2026-10-12'] },
  'dk udbetaling-danmark': { hidden: ['Mette', 'Eksempel', 'Eksempelvej', '300785-1234'], kept: ['Udbetaling', 'Danmark', 'Hillerød'] },
  'uk hmrc': { hidden: ['Sam', 'Example', 'LS1', '4AB', 'QQ', '1234567890'], kept: ['HM', 'Revenue', 'BX9'] },
  'ie intreo': { hidden: ['Tomás', 'Quay', 'T23', '7654321W'], kept: ['Intreo', 'T12'] },
  'us irs': { hidden: ['Jordan', 'Springfield,', 'XXX-XX-1234', '1-800-555-0100'], kept: ['Internal', '$1,234.56', '64999-0025'] },
  'ca ircc': { hidden: ['Ahmed', '0A1', 'E001234567'], kept: ['Immigration,', 'IRCC'] },
};

for (const [name, expected] of Object.entries(SAMPLES)) {
  test(`hides the private details in the ${name} example letter`, () => {
    const [countryId, sampleId] = name.split(' ');
    const country = countryById(countryId);
    const text = country.samples.find((sample) => sample.id === sampleId).build('2026-10-15');
    const { hidden, shown } = check(text, countryId);
    for (const word of expected.hidden) assert.ok(hidden.has(word) && !shown.has(word), `${word} should be hidden`);
    for (const word of expected.kept) assert.ok(shown.has(word), `${word} should stay visible`);
  });
}

test('every example letter keeps the sender, the amount and the dates visible', () => {
  for (const country of COUNTRIES) {
    for (const sample of country.samples) {
      const text = sample.build('2026-10-15');
      const pages = [page(text)];
      const boxes = findPrivate(pages, country);
      const shown = visible(pages, boxes);
      const label = `${country.id} ${sample.id}`;
      assert.ok(boxes.some((box) => box.kind === 'address'), `${label}: finds the address`);
      assert.equal(shown.split('\n')[0], pages[0].lines[0].words.map((word) => word.text).join(' '), `${label}: keeps the sender`);
      const result = analyze(text, { country: country.id, today: '2026-10-15' });
      if (result.money.toPay) assert.ok(shown.includes(result.money.toPay.source.split(/\s/).find((part) => /\d/.test(part))), `${label}: keeps the amount`);
      for (const date of result.dates.filter((item) => item.source && !item.estimated)) {
        assert.ok(shown.includes(date.source.split(/\s/)[0]), `${label}: keeps the date ${date.source}`);
      }
    }
  }
});

test('hides an IBAN only when it is valid or labelled', () => {
  assert.ok(check('Überweisung an DE89 3704 0044 0532 0130 00 bitte.').hidden.has('DE89'));
  assert.ok(!check('Code DE12 3456 7890 1234 5678 90 ist kein Konto.').hidden.has('DE12'));
  assert.ok(check('IBAN: DE12 3456 7890 1234 5678 90').hidden.has('DE12'));
});

test('hides phone numbers and email addresses but not amounts or dates', () => {
  const { hidden } = check('Rufen Sie an: Tel.: +49 30 1234567 oder Telefon 030 12345678.\nE-Mail: erika.muster@example.de\nBetrag: 1.234,56 € bis 09-10-2026.');
  for (const word of ['+49', '1234567', '030', '12345678.', 'erika.muster@example.de']) assert.ok(hidden.has(word), word);
  for (const word of ['1.234,56', '09-10-2026', 'Betrag:']) assert.ok(!hidden.has(word), word);
});

test('hides a birth date but keeps other dates', () => {
  const { hidden } = check('Datum: 12.10.2026\nErika Muster, geboren am 03.04.1985 in Leipzig\nDate of birth: 4 March 1979');
  assert.ok(hidden.has('03.04.1985'));
  assert.ok(hidden.has('March'));
  assert.ok(!hidden.has('12.10.2026'));
  assert.ok(!hidden.has('Leipzig'));
});

test('hides personal ID numbers by their shape', () => {
  const ids = ['756.1234.5678.97', 'SMPSRH90C54Z404N', 'Y7654321G', '850730-1234', '85.07.30-033.28', '123-45-6789'];
  const { hidden } = check(`Unterlagen\n${ids.join('\n')}\nSumme 450,00 €`);
  for (const id of ids) assert.ok(hidden.has(id), id);
  assert.ok(!hidden.has('450,00'));
  assert.ok(check('National Insurance number QQ 12 34 56 C', 'uk').hidden.has('QQ'));
});

test('hides the name from the greeting everywhere in the letter', () => {
  const { hidden } = check('Dear Ms Okafor,\n\nWe wrote to Ms Okafor last month.\n\nYours sincerely', 'uk');
  assert.ok(hidden.has('Okafor,'));
  assert.ok(hidden.has('Okafor'));
  assert.ok(!hidden.has('Ms'));
  assert.equal(check('Sehr geehrte Damen und Herren,\n\nwir schreiben Ihnen.').boxes.length, 0);
});

test('hides labelled names but not the office that gets the money', () => {
  const { hidden } = check('Name: Erika Muster\nEmpfänger: Finanzamt Chemnitz\nIhre Angaben zu Erika wurden geprüft.');
  assert.ok(hidden.has('Erika'));
  assert.ok(hidden.has('Muster'));
  assert.ok(!hidden.has('Finanzamt'));
});

test('finds an address without a title, but not in the sender block', () => {
  const text = 'Försäkringskassan\nBox 123\n103 51 Stockholm\n\nAnna Lind\nStorgatan 5\n171 45 Solna\n\nHej,';
  const { hidden } = check(text, 'se');
  for (const word of ['Anna', 'Lind', 'Storgatan', 'Solna']) assert.ok(hidden.has(word), word);
  for (const word of ['Försäkringskassan', 'Stockholm']) assert.ok(!hidden.has(word), word);
  assert.ok(!check('Stadtwerke Musterstadt\nKundenservice\nRingstraße 1\n12345 Musterstadt\n\nRechnung').hidden.has('Stadtwerke'));
});

test('finds blocks by the space between lines when there are no empty lines', () => {
  const pages = [{
    width: 800,
    height: 400,
    lines: [
      ['Stadtwerke', 'Musterstadt', '·', 'Ringstraße', '1', '·', '12345', 'Musterstadt'],
      ['Herrn'], ['Jonas', 'Weber'], ['Bahnhofstraße', '8'], ['12345', 'Musterstadt'],
      ['Ihre', 'Rechnung', 'vom', '01.10.2026'],
    ].map((words, row) => ({
      words: words.map((text, index) => ({ text, x0: 40 + index * 90, x1: 40 + index * 90 + text.length * 7, y0: 20 + row * 16 + (row >= 1 ? 14 : 0) + (row >= 5 ? 20 : 0), y1: 32 + row * 16 + (row >= 1 ? 14 : 0) + (row >= 5 ? 20 : 0) })),
    })),
  }];
  const text = readLayout(pages[0]).text;
  assert.match(text, /Musterstadt\n\nHerrn\nJonas Weber/);
  const boxes = findPrivate(pages, countryById('de'));
  const hidden = hiddenWords(pages, boxes);
  for (const word of ['Herrn', 'Jonas', 'Weber', 'Bahnhofstraße']) assert.ok(hidden.has(word), word);
  for (const word of ['Stadtwerke', 'Rechnung', '01.10.2026']) assert.ok(!hidden.has(word), word);
});

test('keeps a second column on the same lines apart from the address', () => {
  const pages = [columns('Finanzamt Musterstadt\nPostfach 1 · 12345 Musterstadt\n\nFrau\nLena Vogel\nAm Markt 3\n54321 Beispielstadt', '\n\n\nDatum: 12.10.2026\nSteuernummer: 123/456/78901\nZimmer 4\nAuskunft: Herr Braun')];
  const hidden = hiddenWords(pages, findPrivate(pages, countryById('de')));
  for (const word of ['Frau', 'Lena', 'Vogel', 'Markt', 'Beispielstadt', '123/456/78901']) assert.ok(hidden.has(word), word);
  for (const word of ['Datum:', '12.10.2026', 'Zimmer', 'Steuernummer:', 'Finanzamt']) assert.ok(!hidden.has(word), word);
});

test('covers only the private part of a word that was read together', () => {
  const pages = [page('Steuernummer:214/123/45678')];
  const [box] = findPrivate(pages, countryById('de'));
  const word = pages[0].lines[0].words[0];
  assert.ok(box.x0 > word.x0 + CHAR * 10);
  assert.ok(box.x1 >= word.x1);
});

test('joins boxes on one line and keeps them inside the page', () => {
  const pages = [page('Sehr geehrter Herr Max Beispiel,\n\nIBAN: DE89 3704 0044 0532 0130 00')];
  const boxes = findPrivate(pages, countryById('de'));
  assert.equal(boxes.length, 2);
  for (const box of boxes) {
    assert.ok(box.x0 >= 0 && box.y0 >= 0 && box.x1 <= pages[0].width && box.y1 <= pages[0].height);
    assert.ok(box.x1 > box.x0 && box.y1 > box.y0);
  }
});

test('hides a name from the first page on later pages too', () => {
  const pages = [page('Amt für Wohnen\nMarktplatz 1\n10115 Berlin\n\nHerrn\nPaul Krüger\nLindenstraße 4\n10117 Berlin'), page('Seite 2\n\nWir haben mit Paul Krüger gesprochen.\nAnschrift: Lindenstraße 4')];
  const boxes = findPrivate(pages, countryById('de'));
  const second = hiddenWords([pages[1]], boxes.filter((box) => box.page === 1).map((box) => ({ ...box, page: 0 })));
  for (const word of ['Paul', 'Krüger', 'Lindenstraße']) assert.ok(second.has(word), word);
  assert.ok(!second.has('Seite'));
});
