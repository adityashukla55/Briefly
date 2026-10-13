import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const fr = LANGUAGES.fr;
const france = countryById('fr');

test('CAF overpayment: sender, kind, dates, money, IBAN, references, objection', () => {
  const result = analyze(sampleText('fr', 'caf', TODAY), { today: TODAY, country: 'fr' });
  assert.equal(result.country.id, 'fr');
  assert.equal(result.sender.id, 'caf');
  assert.equal(result.kind.id, 'indu');
  assert.equal(result.kind.type, 'repayment');
  assert.equal(result.letterDate, '2026-10-10');
  assert.equal(result.urgency, 'high');

  assert.deepEqual(result.dates.map((date) => date.type), ['payment', 'objection']);
  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.iso, '2026-11-09');
  assert.equal(payment.estimated, false);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.iso, '2026-12-13');
  assert.equal(objection.estimated, true);
  assert.equal(objection.period, '2 months');

  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.money.toPay.currency, 'EUR');
  assert.equal(result.payment.iban, 'FR76 3000 6000 0112 3456 7890 189');
  assert.equal(result.payment.bic, 'AGRIFRPPXXX');
  assert.equal(result.payment.recipient, 'Caf du Rhône');
  assert.equal(result.payment.reference, '1234567 IND');

  const values = result.references.map((reference) => reference.value);
  assert.ok(values.includes('1234567'));
  assert.ok(result.references.some((reference) => reference.value === '1234567 IND' && reference.payment));
  assert.equal(result.objection, 'recours amiable');
  assert.ok(result.terms.some((term) => term.term === 'indu'));
});

test('CAF overpayment: steps and replies', () => {
  const result = analyze(sampleText('fr', 'caf', TODAY), { today: TODAY, country: 'fr' });
  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Pay €1,234\.56 by Mon, 9 Nov 2026 to the account FR76 3000 6000 0112 3456 7890 189/);
  assert.match(steps, /payment reference field so they know it’s from you: 1234567 IND/);
  assert.match(steps, /send a written objection \(recours amiable\) by Sun, 13 Dec 2026 \(estimated\)/);
  assert.match(steps, /claimant number \(Numéro allocataire\) 1234567/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'debt-relief', 'instalments', 'more-time']);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.equal(objection.title, 'Object to the decision (recours amiable)');
  assert.match(objection.local, /Objet : Recours amiable – décision du 10\/10\/2026/);
  assert.match(objection.local, /Par la présente, je conteste votre décision du 10\/10\/2026\. Ce courrier vaut recours amiable\./);
  assert.match(objection.local, /Numéro allocataire: 1234567/);
  assert.match(objection.local, /^Madame, Monsieur,$/m);

  const relief = replies.find((reply) => reply.id === 'debt-relief');
  assert.match(relief.local, /Objet : Demande de remise de dette/);
  assert.match(relief.local, /Votre courrier du 10\/10\/2026 me demande de rembourser la somme de 1\s234,56\s€\./);
});

test('prefecture appointment: date, time and reply', () => {
  const result = analyze(sampleText('fr', 'prefecture', TODAY), { today: TODAY, country: 'fr' });
  assert.equal(result.sender.id, 'prefecture');
  assert.equal(result.kind.id, 'convocation');
  assert.equal(result.kind.type, 'appointment');
  assert.equal(result.letterDate, '2026-10-11');
  assert.deepEqual(result.dates.map((date) => date.type), ['appointment']);
  assert.equal(result.dates[0].iso, '2026-10-21');
  assert.equal(result.dates[0].time, '09:30');
  assert.equal(result.money.toPay, null);
  assert.equal(result.payment, null);
  assert.equal(result.objection, null);

  const values = result.references.map((reference) => reference.value);
  assert.ok(values.includes('6901234567'));
  assert.ok(values.includes('2026-069-012345'));

  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Go to the appointment on Wed, 21 Oct 2026 at 09:30/);
  const reschedule = buildReplies(result).find((reply) => reply.id === 'reschedule');
  assert.ok(reschedule);
  assert.match(reschedule.local, /Vous m’avez convoqué\(e\) le 21\/10\/2026 à 09h30\./);
});

test('detects France from French text, even when Germany is preferred', () => {
  for (const id of ['caf', 'prefecture']) {
    const result = analyze(sampleText('fr', id, TODAY), { today: TODAY, preferred: 'de' });
    assert.equal(result.country.id, 'fr', id);
  }
});

test('sample IBAN has a valid checksum', () => {
  assert.equal(isValidIban('FR76 3000 6000 0112 3456 7890 189'), true);
  assert.equal(isValidIban('FR76 3000 6000 0112 3456 7890 188'), false);
});

test('senders and kinds in short French letters', () => {
  const cases = [
    ['Direction générale des Finances publiques\nAvis d’impôt 2026 sur les revenus de l’année 2025\nDate limite de paiement : 15/11/2026', 'dgfip', 'impot'],
    ['ANTAI\nAvis de contravention\nAmende forfaitaire : 135 €', 'antai', 'contravention'],
    ['Trésor public\nCentre d’encaissement des amendes\nAvis d’amende forfaitaire majorée\nMontant à payer : 375,00 €', 'tresor', 'majoree'],
    ['Maître Paul Exemple, commissaire de justice\nCommandement de payer aux fins de saisie-vente\nSomme due : 2 480,15 €', 'commissaire', 'saisie'],
    ['Agence immobilière du Parc\nObjet : Congé pour vente\nEn tant que bailleur, nous vous donnons congé.', 'bailleur', 'resiliation'],
    ['EDF\nFacture du 01/10/2026\nMontant à payer : 84,20 €', 'energie', 'facture'],
    ['France Travail\nNous ne pouvons pas donner une suite favorable à votre demande d’aide au retour à l’emploi.', 'france-travail', 'refus'],
    ['URSSAF\nMise en demeure\nCotisations sociales impayées : 1 050,00 €', 'urssaf', 'mise-en-demeure'],
    ['Assurance Maladie\nVos droits sont ouverts.', 'cpam', 'droits'],
    ['Office public de l’habitat\nRégularisation des charges 2025\nReste à payer : 145,20 €', 'bailleur', 'charges'],
    ['Caf de Paris\nAfin de compléter votre dossier, merci de nous transmettre les pièces justificatives suivantes.', 'caf', 'pieces'],
    ['Tribunal judiciaire de Lyon\nOrdonnance portant injonction de payer', 'tribunal', 'injonction'],
  ];
  for (const [text, sender, kind] of cases) {
    const result = analyze(text, { today: TODAY, country: 'fr' });
    assert.equal(result.sender?.id, sender, text);
    assert.equal(result.kind?.id, kind, text);
  }
});

test('tax notice references and payment date', () => {
  const result = analyze('Finances publiques\nAvis d’impôt 2026\nNuméro fiscal : 01 23 456 789 012\nRéférence de l’avis : 26 69 A123456 78\nMontant de votre impôt : 1 312,00 €\nDate limite de paiement : 15/11/2026', { today: TODAY, country: 'fr' });
  assert.deepEqual(result.references.map((reference) => reference.value), ['01 23 456 789 012', '26 69 A123456 78']);
  assert.equal(result.money.toPay.amount, 1312);
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso]), [['payment', '2026-11-15']]);
});

test('French dates', () => {
  assert.equal(findDates('15/11/2026', fr)[0].iso, '2026-11-15');
  assert.equal(findDates('1er décembre 2026', fr)[0].iso, '2026-12-01');
  const [appointment] = findDates('le 21 octobre 2026 à 9h30', fr);
  assert.equal(appointment.iso, '2026-10-21');
  assert.equal(appointment.time, '09:30');
});

test('French periods', () => {
  const [twoMonths] = findPeriods('dans un délai de deux mois à compter de la notification', fr);
  assert.equal(twoMonths.amount, 2);
  assert.equal(twoMonths.unit, 'month');
  assert.equal(twoMonths.from, 'notification');
  const [thirtyDays] = findPeriods('sous 30 jours', fr);
  assert.equal(thirtyDays.amount, 30);
  assert.equal(thirtyDays.unit, 'day');
});

test('French amounts', () => {
  assert.equal(findMoney('Montant : 1 234,56 €', france).items[0].amount, 1234.56);
  assert.equal(findMoney('Montant : 1234,56 euros', france).items[0].amount, 1234.56);
  assert.equal(findMoney('Montant : € 55,00', france).items[0].amount, 55);
  assert.equal(findMoney('Montant : 1 234,56 €', france).items[0].currency, 'EUR');
});

test('pack shape: unique slugs and valid kind types', () => {
  const types = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];
  for (const kind of france.kinds) assert.ok(types.includes(kind.type), kind.id);
  for (const list of [france.senders, france.glossary]) {
    const slugs = list.map((item) => item.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
  assert.equal(new Set(france.glossary.map((entry) => entry.term)).size, france.glossary.length);
  assert.equal(france.samples.length, 2);
});
