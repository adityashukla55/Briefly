import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, isValidIban } from '../web/src/analyze.js';
import { countryById, detectLanguage, sampleText } from '../web/src/countries/index.js';
import { findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-14';
const pt = countryById('pt');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, preferred: 'de' });
const sample = (id) => analyze(sampleText('pt', id, TODAY), { today: TODAY, country: 'pt' });
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const dates = (result) => result.dates.map((date) => [date.type, date.iso]);

test('pack has the expected shape', () => {
  assert.equal(pt.slug, 'portugal');
  assert.equal(pt.language, 'pt');
  assert.equal(pt.currency, 'EUR');
  assert.ok(pt.senders.length >= 13 && pt.senders.length <= 16);
  assert.ok(pt.kinds.length >= 12 && pt.kinds.length <= 20);
  assert.ok(pt.references.length >= 8 && pt.references.length <= 12);
  assert.ok(pt.glossary.length >= 35 && pt.glossary.length <= 55);
  assert.equal(pt.samples.length, 2);
  for (const kind of pt.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [pt.senders, pt.kinds, pt.glossary]) {
    const ids = list.map((item) => item.id ?? item.slug);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...pt.senders, ...pt.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const stateless = [...pt.signals, ...pt.objection.map((entry) => entry.pattern), ...pt.glossary.map((entry) => entry.pattern), ...[...pt.senders, ...pt.kinds].flatMap((item) => item.patterns)];
  for (const pattern of stateless) assert.ok(!pattern.global, String(pattern));
  assert.ok(pt.references.some((reference) => reference.local === 'NIF' && reference.personal));
  const english = [pt.intro, pt.deliveryNote, pt.objectionAdvice, ...pt.senders.flatMap((sender) => [sender.name, sender.about, ...sender.tips]), ...pt.kinds.flatMap((kind) => [kind.name, kind.about, ...(kind.steps ?? [])]), ...pt.glossary.flatMap((entry) => [entry.meaning, entry.tip ?? ''])];
  for (const text of english) assert.ok(!text.includes('\''), text);
});

test('Portuguese language: dates, times, periods and detection', () => {
  const language = LANGUAGES.pt;
  assert.deepEqual(findDates('Lisboa, 14 de outubro de 2026, às 9h30', language).map((date) => [date.iso, date.time]), [['2026-10-14', '09:30']]);
  assert.deepEqual(findPeriods('no prazo de 15 dias úteis a contar da notificação', language).map((period) => [period.amount, period.unit, period.from]), [[15, 'workday', 'notificação']]);
  assert.deepEqual(findPeriods('no prazo de 30 dias', language).map((period) => period.unit), ['day']);
  assert.equal(detectLanguage(sampleText('pt', 'at', TODAY)).id, 'pt');
  assert.ok(isValidIban('PT50 0002 0123 1234 5678 9015 4'));
});

test('tax sample: amount, payment reference and 120 days after the payment deadline', () => {
  const result = sample('at');
  assert.equal(result.sender.id, 'at');
  assert.equal(result.kind.id, 'tax-bill');
  assert.equal(result.letterDate, '2026-10-11');
  assert.deepEqual(dates(result), [['payment', '2026-11-10'], ['objection', '2027-03-10']]);
  assert.equal(result.money.toPay.amount, 1234.56);
  assert.match(stepText(result), /Put this in the payment reference field so they know it’s from you: 1234 5678 9012 345/);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reclamacao-graciosa', 'instalments', 'more-time']);
  assert.match(replies[0].local, /Exmos\. Senhores,/);
  assert.match(replies[0].local, /reclamação graciosa contra a liquidação de 11\/10\/2026, n\.º 2026 1234567/);
  assert.match(replies[1].local, /1234,56\s€|1\.234,56\s€|1\s234,56\s€/);
});

test('AIMA sample: appointment with time', () => {
  const result = sample('aima');
  assert.equal(result.sender.id, 'aima');
  assert.equal(result.kind.id, 'appointment');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-22', '09:30']]);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.match(replies[0].local, /Fui convocado\(a\) para o dia 22\/10\/2026 às 09:30\./);
});

test('samples are detected as Portuguese letters, Spanish ones stay Spanish', () => {
  for (const id of ['at', 'aima']) assert.equal(run(sampleText('pt', id, TODAY)).country.id, 'pt');
  assert.equal(run(sampleText('es', 'extranjeria', TODAY)).country.id, 'es');
});

test('Multibanco invoice: entity and reference as the way to pay', () => {
  const result = run(`EDP Comercial
Lisboa, 5 de outubro de 2026
N.º de cliente: 123456789
Informamos que a sua fatura no valor de 87,45 € se encontra em atraso.
Valor a pagar: 87,45 €
Data limite de pagamento: 20/10/2026
Pagamento por Multibanco:
Entidade: 21098
Referência: 123 456 789`);
  assert.equal(result.sender.id, 'energy');
  assert.equal(result.payment.account.text, 'Multibanco, entity 21098, reference 123 456 789');
  assert.match(stepText(result), /Pay €87\.45 by Tue, 20 Oct 2026 to Multibanco, entity 21098, reference 123 456 789\./);
});

test('traffic fine: minimum amount and 15 working days', () => {
  const result = run(`ANSR — Autoridade Nacional de Segurança Rodoviária
Data: 7 de outubro de 2026
Auto de contraordenação n.º 912345678
No dia 28 de setembro de 2026, às 14h22, o veículo circulava em excesso de velocidade.
Coima: mínimo 120,00 € — máximo 600,00 €
Pode efetuar o pagamento voluntário da coima pelo valor mínimo ou apresentar defesa no prazo de 15 dias úteis a contar da notificação.`);
  assert.equal(result.kind.id, 'traffic-fine');
  assert.equal(result.money.toPay.amount, 120);
  assert.deepEqual(dates(result), [['objection', '2026-10-30']]);
  assert.equal(buildReplies(result)[0].id, 'defesa');
});

test('prior hearing: date to give your side and a ready-made answer', () => {
  const result = run(`Instituto da Segurança Social, I.P.
Porto, 6 de outubro de 2026
Assunto: Audiência prévia — subsídio de desemprego
Verificámos que recebeu indevidamente subsídio de desemprego no valor de 845,20 €.
Pode pronunciar-se por escrito no prazo de 10 dias úteis a contar da data da notificação.`);
  assert.equal(result.kind.id, 'prior-hearing');
  assert.match(stepText(result), /You can explain your side in writing by Fri, 23 Oct 2026 \(estimated\)/);
  assert.equal(buildReplies(result)[0].id, 'audiencia-previa');
});

test('template letters are in Portuguese', () => {
  const letters = templateLetters(pt);
  assert.ok(letters.length >= 4);
  assert.match(letters[0].local, /Com os melhores cumprimentos,/);
});
