import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { addDays, findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const it = countryById('it');
const italian = LANGUAGES.it;
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (id, today = TODAY) => analyze(sampleText('it', id, today), { today, country: 'it' });

test('pack has the expected shape', () => {
  assert.equal(it.id, 'it');
  assert.equal(it.slug, 'italy');
  assert.ok(it.senders.length >= 12 && it.senders.length <= 16);
  assert.ok(it.kinds.length >= 12 && it.kinds.length <= 16);
  assert.ok(it.references.length >= 8 && it.references.length <= 12);
  assert.ok(it.glossary.length >= 35 && it.glossary.length <= 50);
  assert.equal(it.samples.length, 2);
  for (const kind of it.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [it.senders, it.kinds, it.glossary]) {
    const ids = list.map((item) => item.id ?? item.slug);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...it.senders, ...it.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const entry of it.glossary) assert.ok(!entry.pattern.flags.includes('g'), entry.term);
  assert.ok(it.references.some((reference) => reference.local === 'Causale' && reference.payment));
});

test('cartella: sender, kind, dates, money, IBAN and references', () => {
  const result = run('cartella');
  assert.equal(result.sender.id, 'ader');
  assert.equal(result.kind.id, 'cartella');
  assert.equal(result.kind.type, 'fee-decision');
  assert.equal(result.letterDate, '2026-10-08');
  assert.equal(result.urgency, 'high');

  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.iso, '2026-12-07');
  assert.equal(payment.estimated, false);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.iso, '2026-12-10');
  assert.equal(objection.estimated, true);
  assert.equal(objection.period, '60 days');
  assert.equal(objection.label, 'Last day to object (ricorso)');

  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.money.toPay.currency, 'EUR');
  assert.equal(result.money.toGet, null);
  assert.equal(result.payment.iban, 'IT60 X054 2811 1010 0000 0123 456');
  assert.equal(result.payment.reference, '3010 0000 0012 3456 78');
  assert.equal(result.payment.recipient, 'Agenzia delle entrate-Riscossione');

  const values = Object.fromEntries(result.references.map((reference) => [reference.local, reference]));
  assert.equal(values['Numero cartella'].value, '068 2026 0012345678 000');
  assert.equal(values['Codice fiscale'].value, 'SMPSRH90C54Z404N');
  assert.equal(values['Codice avviso PagoPA'].value, '3010 0000 0012 3456 78');
  assert.equal(values['Codice avviso PagoPA'].payment, true);
  assert.equal(result.objection, 'ricorso');
  assert.ok(result.terms.some((term) => term.term === 'Cartella di pagamento'));
  assert.ok(result.terms.some((term) => term.term === 'PagoPA'));
});

test('cartella: steps and replies', () => {
  const result = run('cartella');
  const steps = buildSteps(result).map((step) => step.text);
  assert.ok(steps.includes('Pay €1,234.56 by Mon, 7 Dec 2026 to the account IT60 X054 2811 1010 0000 0123 456.'));
  assert.ok(steps.some((step) => step.includes('3010 0000 0012 3456 78')));
  assert.ok(steps.some((step) => step.includes('payment plan (rateizzazione)')));
  assert.ok(steps.some((step) => step.includes('written objection (ricorso) by Thu, 10 Dec 2026 (estimated)')));
  assert.ok(steps.some((step) => step.includes('(Numero cartella) 068 2026 0012345678 000')));

  const replies = buildReplies(result);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.ok(objection.local.includes('Oggetto: ricorso avverso il Vostro provvedimento del 08/10/2026'));
  assert.ok(objection.local.includes('con la presente il/la sottoscritto/a presenta ricorso avverso il Vostro provvedimento del 08/10/2026.'));
  assert.ok(objection.local.includes('Numero cartella: 068 2026 0012345678 000'));
  assert.ok(objection.local.includes('[Agenzia delle entrate-Riscossione]'));
  const autotutela = replies.find((reply) => reply.id === 'autotutela');
  assert.ok(autotutela.local.includes('Oggetto: Istanza di annullamento in autotutela'));
  assert.ok(autotutela.local.includes('chiede l’annullamento o la correzione in autotutela del Vostro atto del 08/10/2026.'));
  assert.ok(replies.some((reply) => reply.id === 'instalments'));
  assert.ok(replies.some((reply) => reply.id === 'more-time'));
});

test('questura: appointment with time, no money', () => {
  const result = run('questura');
  assert.equal(result.sender.id, 'questura');
  assert.equal(result.kind.id, 'convocazione');
  assert.equal(result.kind.type, 'appointment');
  assert.equal(result.letterDate, '2026-10-09');
  assert.deepEqual(result.dates.map((date) => date.type), ['appointment']);
  assert.equal(result.dates[0].iso, '2026-10-21');
  assert.equal(result.dates[0].time, '09:30');
  assert.equal(result.money.toPay, null);
  assert.equal(result.payment, null);
  assert.equal(result.objection, null);

  const values = Object.fromEntries(result.references.map((reference) => [reference.local, reference.value]));
  assert.equal(values['Numero pratica'], '26BO-0012345');
  assert.equal(values.Protocollo, '2026/IMM/004567');
  assert.equal(values['Codice fiscale'], 'SMPDNL88E21Z404M');

  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Go to the appointment on Wed, 21 Oct 2026 at 09:30/);
  assert.match(steps, /\(Numero pratica\) 26BO-0012345/);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.ok(replies[0].local.includes('sono stato/a convocato/a il 21/10/2026 alle ore 09:30.'));
});

test('samples stay relative to today', () => {
  const today = '2027-02-26';
  const cartella = run('cartella', today);
  assert.equal(cartella.letterDate, addDays(today, -5));
  assert.equal(cartella.dates.find((date) => date.type === 'payment').iso, '2027-04-22');
  const questura = run('questura', today);
  assert.equal(questura.letterDate, addDays(today, -4));
  assert.equal(questura.dates[0].iso, '2027-03-08');
  assert.equal(questura.dates[0].time, '09:30');
});

test('Italian letters are detected as Italy', () => {
  for (const sample of it.samples) {
    const result = analyze(sample.build(TODAY), { today: TODAY, preferred: 'de' });
    assert.equal(result.country.id, 'it', sample.id);
  }
});

test('objection word: opposizione for a court payment order', () => {
  const text = 'TRIBUNALE DI NAPOLI\nNapoli, 01/10/2026\nIl Giudice, letto il ricorso per decreto ingiuntivo, ingiunge di pagare la somma di € 2.300,00. Entro lo stesso termine può essere proposta opposizione.';
  const result = analyze(text, { today: TODAY, country: 'it' });
  assert.equal(result.sender.id, 'tribunale');
  assert.equal(result.objection, 'opposizione');
});

test('preavviso di rigetto is a chance to explain, not a refusal', () => {
  const text = 'QUESTURA DI ROMA – Ufficio Immigrazione\nRoma, 07/10/2026\nOggetto: preavviso di rigetto ai sensi dell’art. 10-bis della Legge 241/1990.\nPuò presentare osservazioni scritte entro dieci giorni dal ricevimento della presente.';
  const result = analyze(text, { today: TODAY, country: 'it' });
  assert.equal(result.kind.id, 'preavviso-rigetto');
  assert.equal(result.kind.type, 'hearing');
  const deadline = result.dates.find((date) => date.type === 'deadline');
  assert.equal(deadline.iso, '2026-10-20');
});

test('Italian IBAN checksum', () => {
  assert.equal(isValidIban('IT60 X054 2811 1010 0000 0123 456'), true);
  assert.equal(isValidIban('IT61 X054 2811 1010 0000 0123 456'), false);
});

test('findDates: numeric, written and with time', () => {
  assert.equal(findDates('20/11/2026', italian)[0].iso, '2026-11-20');
  assert.equal(findDates('15 novembre 2026', italian)[0].iso, '2026-11-15');
  const [withTime] = findDates('il 21/10/2026 alle ore 9:30', italian);
  assert.equal(withTime.iso, '2026-10-21');
  assert.equal(withTime.time, '09:30');
});

test('findPeriods: digits and number words', () => {
  const [sixty] = findPeriods('entro 60 giorni dalla notifica', italian);
  assert.equal(sixty.amount, 60);
  assert.equal(sixty.unit, 'day');
  assert.equal(sixty.from, 'notifica');
  const [thirty] = findPeriods('entro trenta giorni', italian);
  assert.equal(thirty.amount, 30);
  assert.equal(thirty.unit, 'day');
  assert.equal(thirty.from, null);
});

test('findMoney: euro sign, word before and word after', () => {
  for (const text of ['€ 1.234,56', 'Euro 1.234,56', '1.234,56 euro']) {
    const { items } = findMoney(text, it);
    assert.equal(items.length, 1, text);
    assert.equal(items[0].amount, 1234.56, text);
    assert.equal(items[0].currency, 'EUR', text);
  }
});
