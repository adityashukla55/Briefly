import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze } from '../web/src/analyze.js';
import { countryById, inLanguage, languagesOf, sampleText } from '../web/src/countries/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-14';
const be = countryById('be');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, preferred: 'de' });
const sample = (id) => analyze(sampleText('be', id, TODAY), { today: TODAY, country: 'be' });
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const dates = (result) => result.dates.map((date) => [date.type, date.iso]);

test('pack has the expected shape', () => {
  assert.equal(be.slug, 'belgium');
  assert.deepEqual(languagesOf(be), ['nl', 'fr']);
  assert.equal(be.currency, 'EUR');
  assert.ok(be.senders.length >= 13 && be.senders.length <= 16);
  assert.ok(be.kinds.length >= 12 && be.kinds.length <= 20);
  assert.ok(be.references.length >= 8 && be.references.length <= 12);
  assert.ok(be.glossary.length >= 35 && be.glossary.length <= 55);
  assert.equal(be.samples.length, 2);
  for (const kind of be.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [be.senders, be.kinds, be.glossary]) {
    const ids = list.map((item) => item.id ?? item.slug);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...be.senders, ...be.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const entry of be.glossary) assert.ok(['nl', 'fr'].includes(entry.language), entry.term);
  const french = inLanguage(be, 'fr');
  const stateless = [...be.signals, ...be.objection.map((entry) => entry.pattern), ...french.objection.map((entry) => entry.pattern), ...be.glossary.map((entry) => entry.pattern), ...[...be.senders, ...be.kinds].flatMap((item) => item.patterns)];
  for (const pattern of stateless) assert.ok(!pattern.global, String(pattern));
  assert.ok(be.references.some((reference) => reference.local === 'Rijksregisternummer' && reference.personal));
  assert.ok(french.references.some((reference) => reference.local === 'N° de registre national' && reference.personal));
  const english = [be.intro, be.deliveryNote, be.objectionAdvice, ...be.senders.flatMap((sender) => [sender.name, sender.about, ...sender.tips]), ...be.kinds.flatMap((kind) => [kind.name, kind.about, ...(kind.steps ?? [])]), ...be.glossary.flatMap((entry) => [entry.meaning, entry.tip ?? ''])];
  for (const text of english) assert.ok(!text.includes('\''), text);
});

test('the French version swaps only language-specific parts', () => {
  const french = inLanguage(be, 'fr');
  assert.equal(french.language, 'fr');
  assert.equal(french.id, 'be');
  assert.equal(french.help.instalments, 'plan de paiement');
  assert.equal(french.senders, be.senders);
  assert.equal(inLanguage(be, 'nl'), be);
  assert.equal(inLanguage(be, 'de'), be);
});

test('Dutch tax sample: payment code, IBAN, payment date and 6 months to object', () => {
  const result = sample('tax');
  assert.equal(result.country.language, 'nl');
  assert.equal(result.sender.id, 'fin');
  assert.equal(result.kind.id, 'tax-bill');
  assert.equal(result.letterDate, '2026-10-11');
  assert.deepEqual(dates(result), [['payment', '2026-12-11'], ['objection', '2027-04-14']]);
  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.payment.iban, 'BE68 5390 0754 7034');
  assert.equal(result.payment.reference, '+++123/4567/89002+++');
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [['Artikelnummer', '123.456.789'], ['Rijksregisternummer', '85.07.30-033.28'], ['Gestructureerde mededeling', '+++123/4567/89002+++']]);
  assert.equal(result.objection, 'bezwaarschrift');
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['tax-objection', 'instalments', 'more-time']);
  assert.match(replies[0].local, /Hierbij dien ik een bezwaarschrift in tegen het aanslagbiljet van 11\/10\/2026\./);
  assert.match(replies[0].local, /Artikelnummer: 123\.456\.789/);
  assert.match(replies[1].local, /1\.234,56/);
  assert.match(stepText(result), /Pay €1,234\.56 by Fri, 11 Dec 2026 to the account BE68 5390 0754 7034\./);
});

test('French appointment sample: detected as Belgian French, time read', () => {
  const result = sample('forem');
  assert.equal(result.country.language, 'fr');
  assert.equal(result.sender.id, 'employment');
  assert.equal(result.kind.id, 'appointment');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-22', '09:30']]);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.match(replies[0].local, /Madame, Monsieur,/);
  assert.match(replies[0].local, /N° de dossier: 2026\/123456/);
});

test('samples are detected as Belgian letters without picking the country', () => {
  assert.deepEqual([run(sampleText('be', 'tax', TODAY)).country.id, run(sampleText('be', 'tax', TODAY)).country.language], ['be', 'nl']);
  assert.deepEqual([run(sampleText('be', 'forem', TODAY)).country.id, run(sampleText('be', 'forem', TODAY)).country.language], ['be', 'fr']);
});

test('letters from the Netherlands and France are not taken for Belgian ones', () => {
  assert.equal(run(sampleText('nl', 'tax', TODAY)).country.id, 'nl');
  assert.equal(run(sampleText('fr', 'caf', TODAY)).country.id, 'fr');
});

test('French tax bill: réclamation within 6 months, French replies', () => {
  const result = run(`SPF Finances
Date d'envoi : 09/10/2026
Numéro d'article : 987.654.321

AVERTISSEMENT-EXTRAIT DE RÔLE
Impôt des personnes physiques - Exercice d'imposition 2026

Montant à payer : 1 234,56 €
Date d'échéance : 09/12/2026
Veuillez payer sur le compte BE68 5390 0754 7034 avec la communication structurée +++123/4567/89002+++.
Si vous n'êtes pas d'accord, vous pouvez introduire une réclamation dans un délai de six mois à compter du troisième jour ouvrable qui suit la date d'envoi.`);
  assert.deepEqual([result.country.id, result.country.language], ['be', 'fr']);
  assert.equal(result.kind.id, 'tax-bill');
  assert.deepEqual(dates(result), [['payment', '2026-12-09'], ['objection', '2027-04-12']]);
  assert.equal(result.money.toPay.amount, 1234.56);
  const replies = buildReplies(result);
  assert.equal(replies[0].id, 'tax-objection');
  assert.match(replies[0].local, /j’introduis une réclamation contre l’avertissement-extrait de rôle du 09\/10\/2026/);
  assert.match(replies[0].local, /Numéro d’article : 987\.654\.321/);
  assert.match(replies[1].local, /Objet : Demande de plan de paiement/);
});

test('Belgian wording: endéans, binnen de 30 dagen, past offence time ignored', () => {
  const notice = run(`Huissier de justice Exemple
1000 Bruxelles
Bruxelles, le 7 octobre 2026
Mise en demeure
Nous vous mettons en demeure de payer la somme de 845,20 € endéans les 15 jours de la présente.`);
  assert.equal(notice.kind.id, 'formal-notice');
  assert.deepEqual(dates(notice), [['payment', '2026-10-25']]);
  const fine = run(`Federale Politie
Brussel, 8 oktober 2026
Voorstel tot onmiddellijke inning
Op 1 oktober 2026 om 14:22 werd met uw voertuig een snelheidsovertreding vastgesteld in 2000 Antwerpen.
Te betalen bedrag: 116,00 EUR
Gelieve dit bedrag binnen de 30 dagen te betalen op rekening BE68 5390 0754 7034.`);
  assert.equal(fine.kind.id, 'traffic-fine');
  assert.deepEqual(dates(fine), [['payment', '2026-11-10']]);
  assert.ok(!buildReplies(fine).some((reply) => reply.id === 'objection'));
});

test('template letters exist in Dutch', () => {
  const letters = templateLetters(be);
  assert.ok(letters.length >= 4);
  assert.match(letters[0].local, /Geachte heer\/mevrouw,/);
});
