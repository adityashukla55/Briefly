import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const nl = LANGUAGES.nl;
const netherlands = countryById('nl');

const dateList = (result) => result.dates.map((date) => [date.type, date.iso]);
const taxLetter = () => analyze(sampleText('nl', 'tax', TODAY), { today: TODAY, country: 'nl' });
const indLetter = () => analyze(sampleText('nl', 'ind', TODAY), { today: TODAY, country: 'nl' });

test('nl tax assessment: sender, kind, dates, money, IBAN, references, objection', () => {
  const result = taxLetter();
  assert.equal(result.country.id, 'nl');
  assert.equal(result.sender.id, 'belastingdienst');
  assert.equal(result.kind.id, 'aanslag');
  assert.equal(result.kind.type, 'tax-assessment');
  assert.equal(result.letterDate, '2026-10-09');

  assert.deepEqual(result.dates.map((date) => date.type).sort(), ['objection', 'payment']);
  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.iso, '2026-12-09');
  assert.equal(payment.estimated, false);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.estimated, true);
  assert.equal(objection.label, 'Last day to object (bezwaar)');
  assert.equal(objection.source, 'binnen zes weken na de dagtekening');

  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.money.toPay.currency, 'EUR');
  assert.equal(result.payment.iban, 'NL91 ABNA 0417 1643 00');
  assert.equal(result.payment.recipient, 'Belastingdienst');
  assert.equal(result.payment.reference, '9999 9001 9560 1234');
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value, reference.payment]), [
    ['Aanslagnummer', '9999.90.019.H.56.01', false],
    ['Betalingskenmerk', '9999 9001 9560 1234', true],
    ['BSN', '999990019', false],
  ]);
  assert.equal(result.objection, 'bezwaar');
  assert.ok(result.terms.some((term) => term.term === 'bezwaar'));
  assert.ok(result.terms.some((term) => term.term === 'dagtekening'));
});

test('nl tax assessment: bezwaar deadline is 6 weeks after the dagtekening', () => {
  const result = taxLetter();
  assert.deepEqual(dateList(result), [['objection', '2026-11-20'], ['payment', '2026-12-09']]);
  assert.equal(result.dates[0].period, '6 weeks');
  assert.equal(result.urgency, 'medium');
  assert.match(buildSteps(result).map((step) => step.text).join(' '), /send a written objection \(bezwaar\) by Fri, 20 Nov 2026 \(estimated\)/);
});

test('nl tax assessment: steps and replies', () => {
  const result = taxLetter();
  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Pay €1,234\.56 by Wed, 9 Dec 2026 to the account NL91 ABNA 0417 1643 00\./);
  assert.match(steps, /payment reference field so they know it’s from you: 9999 9001 9560 1234/);
  assert.match(steps, /ask for a payment plan \(betalingsregeling\)/);
  assert.match(steps, /send a written objection \(bezwaar\) by .+ \(estimated\)/);
  assert.match(steps, /assessment number \(Aanslagnummer\) 9999\.90\.019\.H\.56\.01 on every reply/);
  assert.doesNotMatch(steps, /999990019/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments', 'more-time']);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.equal(objection.title, 'Object to the decision (bezwaar)');
  assert.match(objection.local, /^Betreft: bezwaar tegen uw besluit van 09-10-2026$/m);
  assert.match(objection.local, /^Hierbij teken ik bezwaar aan tegen uw besluit van 09-10-2026\.$/m);
  assert.match(objection.local, /^Aanslagnummer: 9999\.90\.019\.H\.56\.01$/m);
  assert.match(objection.local, /^Geachte heer\/mevrouw,$/m);
  assert.match(objection.local, /^\[Woonplaats\], 13-10-2026$/m);
  assert.doesNotMatch(objection.local, /999990019/);
  assert.match(objection.when, /send it anyway/);

  const instalments = replies.find((reply) => reply.id === 'instalments');
  assert.equal(instalments.title, 'Ask to pay in parts (betalingsregeling)');
  assert.match(instalments.local, /In uw brief van 09-10-2026 vraagt u mij €\s1\.234,56 te betalen\./);
  assert.match(replies.find((reply) => reply.id === 'more-time').local, /geeft u mij een termijn tot 09-12-2026\./);
});

test('nl IND invitation: appointment with time, V-nummer and reschedule reply', () => {
  const result = indLetter();
  assert.equal(result.sender.id, 'ind');
  assert.equal(result.kind.id, 'uitnodiging');
  assert.equal(result.kind.type, 'appointment');
  assert.equal(result.letterDate, '2026-10-12');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-21', '09:30']]);
  assert.equal(result.money.toPay, null);
  assert.equal(result.payment, null);
  assert.equal(result.objection, null);
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [['V-nummer', '3012345678'], ['Kenmerk', '2026-0012345']]);

  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Go to the appointment on Wed, 21 Oct 2026 at 09:30/);
  assert.match(steps, /foreign national number \(V-nummer\) 3012345678 on every reply/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.match(replies[0].local, /^U heeft mij uitgenodigd op 21-10-2026 om 09:30 uur\.$/m);
  assert.match(replies[0].local, /^V-nummer: 3012345678$/m);
  assert.match(replies[0].local, /^\[IND \(Immigratie- en Naturalisatiedienst\)\]$/m);
});

test('detects the Netherlands from Dutch text, even when Germany is preferred', () => {
  for (const id of ['tax', 'ind']) {
    assert.equal(analyze(sampleText('nl', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'nl', id);
  }
  assert.equal(analyze('Belastingdienst\nBetalingskenmerk: 1234 5678 9012 3456\nIBAN: NL91 ABNA 0417 1643 00', { today: TODAY, preferred: 'de' }).country.id, 'nl');
  for (const id of ['tax', 'jobcenter', 'fee']) {
    assert.equal(analyze(sampleText('de', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'de', id);
  }
});

test('nl sample IBAN has a valid checksum', () => {
  assert.equal(isValidIban('NL91 ABNA 0417 1643 00'), true);
  assert.equal(isValidIban('NL91 ABNA 0417 1643 01'), false);
});

test('nl senders and kinds in short Dutch letters', () => {
  const cases = [
    ['Belastingdienst/Toeslagen\nTerugvordering zorgtoeslag 2025\nU heeft te veel zorgtoeslag ontvangen. U moet € 412,00 terugbetalen.', 'toeslagen', 'terugvordering'],
    ['CJIB\nCentraal Justitieel Incassobureau\nBeschikking\nU heeft een verkeersboete gekregen voor te hard rijden.\nBoete: € 109,00', 'cjib', 'boete'],
    ['Gemeente Utrecht\nAanslag gemeentelijke belastingen 2026\nAfvalstoffenheffing € 312,00\nRioolheffing € 180,00', 'gemeente', 'aanslag'],
    ['Waterschap Voorbeeld\nAanslag waterschapsbelasting 2026\nZuiveringsheffing € 120,00', 'waterschap', 'aanslag'],
    ['UWV\nWij hebben besloten dat u geen recht heeft op een WW-uitkering. Uw aanvraag is afgewezen.', 'uwv', 'afwijzing'],
    ['SVB\nToekenning kinderbijslag\nWij hebben uw aanvraag goedgekeurd. U heeft recht op kinderbijslag.', 'svb', 'toekenning'],
    ['DUO\nVerzoek om informatie\nStuur ons een kopie van uw inkomensverklaring.', 'duo', 'informatie'],
    ['Zilveren Kruis\nAanmaning\nU heeft de premie voor uw zorgverzekering nog niet betaald. Openstaand bedrag: € 287,40', 'zorgverzekeraar', 'aanmaning'],
    ['Gerechtsdeurwaarderskantoor Voorbeeld\nBeslaglegging\nWij hebben beslag gelegd op uw loon.', 'deurwaarder', 'beslag'],
    ['Belastingdienst\nDwangbevel\nU heeft de aanslag niet betaald. Wij bevelen u binnen twee dagen te betalen.', 'belastingdienst', 'dwangbevel'],
    ['Woningstichting Voorbeeld\nHuuropzegging\nHierbij zeggen wij de huurovereenkomst op.', 'verhuurder', 'opzegging'],
    ['Vattenfall\nJaarafrekening 2026\nUw verbruik: 2.450 kWh\nTe betalen: € 145,20', 'energie', 'jaarafrekening'],
    ['Incassobureau Voorbeeld B.V.\nSommatie\nNamens onze opdrachtgever vragen wij u de hoofdsom van € 150,00 te betalen, plus incassokosten van € 40,00.', 'incasso', 'aanmaning'],
    ['Rechtbank Amsterdam, sector kanton\nOproeping\nU wordt verwacht op 21-10-2026 om 10:00 uur.', 'rechtbank', 'uitnodiging'],
    ['IND\nWij hebben uw aanvraag voor een verblijfsvergunning afgewezen.', 'ind', 'afwijzing'],
    ['CAK\nBeschikking eigen bijdrage Wlz', 'cak', 'beschikking'],
    ['Belastingdienst\nVoorlopige aanslag inkomstenbelasting 2027\nU betaalt deze voorlopige aanslag in 11 termijnen.', 'belastingdienst', 'voorlopige-aanslag'],
    ['Eneco\nBetalingsherinnering\nWij hebben uw betaling nog niet ontvangen.', 'energie', 'herinnering'],
    ['CZ\nFactuur\nPremie november: € 145,00', 'zorgverzekeraar', 'factuur'],
  ];
  for (const [text, sender, kind] of cases) {
    const result = analyze(text, { today: TODAY, country: 'nl' });
    assert.equal(result.sender?.id, sender, text);
    assert.equal(result.kind?.id, kind, text);
  }
  assert.equal(analyze('Belastingdienst\nUitnodiging tot het doen van aangifte inkomstenbelasting 2026', { today: TODAY, country: 'nl' }).kind, null);
});

test('nl payment demands and enforcement have no objection letter', () => {
  for (const text of [
    'Zilveren Kruis\nAanmaning\nU heeft de premie voor uw zorgverzekering nog niet betaald. Openstaand bedrag: € 287,40',
    'Belastingdienst\nDwangbevel\nU heeft de aanslag niet betaald. Wij bevelen u binnen twee dagen te betalen.',
  ]) {
    const result = analyze(text, { today: TODAY, country: 'nl' });
    assert.equal(result.kind.objection, false);
    assert.ok(!buildReplies(result).some((reply) => reply.id === 'objection'), text);
  }
});

test('nl local tax: kwijtschelding letter', () => {
  const result = analyze('Gemeente Utrecht\nDatum: 28-09-2026\nAanslag gemeentelijke belastingen 2026\nAfvalstoffenheffing: € 312,00\nTotaal te betalen: € 312,00\nBent u het niet eens met deze aanslag? Dan kunt u binnen zes weken na de dagtekening van deze aanslag bezwaar maken.', { today: TODAY, country: 'nl' });
  assert.equal(result.sender.id, 'gemeente');
  assert.equal(result.letterDate, '2026-09-28');
  assert.equal(result.money.toPay.amount, 312);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'kwijtschelding', 'instalments']);
  const relief = replies.find((reply) => reply.id === 'kwijtschelding');
  assert.equal(relief.title, 'Ask to cancel a local tax (kwijtschelding)');
  assert.match(relief.local, /^Betreft: Verzoek om kwijtschelding$/m);
  assert.match(relief.local, /^Hierbij vraag ik kwijtschelding aan voor de aanslag van 28-09-2026, voor een bedrag van €\s312,00\.$/m);
});

test('nl debt collector: ask for proof of the debt', () => {
  const result = analyze('Incassobureau Voorbeeld B.V.\nDatum: 07-10-2026\nSommatie\nNamens onze opdrachtgever vragen wij u de hoofdsom van € 150,00 te betalen, plus incassokosten van € 40,00.\nTotaal te betalen: € 190,00', { today: TODAY, country: 'nl' });
  assert.equal(result.money.toPay.amount, 190);
  const dispute = buildReplies(result).find((reply) => reply.id === 'dispute-debt');
  assert.ok(dispute);
  assert.match(dispute.local, /^Betreft: Betwisting van de vordering$/m);
  assert.match(dispute.local, /^In uw brief van 07-10-2026 vraagt u mij €\s190,00 te betalen\.$/m);
});

test('nl traffic fine: beroep at the public prosecutor', () => {
  const result = analyze('CJIB\nDatum: 05-10-2026\nBeschikking\nVerkeersboete: € 109,00\nBent u het niet eens met deze beschikking? Dan kunt u binnen zes weken na de datum van deze beschikking beroep instellen bij de officier van justitie.', { today: TODAY, country: 'nl' });
  assert.equal(result.kind.id, 'boete');
  assert.equal(result.objection, 'beroep');
  assert.equal(result.money.toPay.amount, 109);
  const objection = buildReplies(result).find((reply) => reply.id === 'objection');
  assert.equal(objection.title, 'Object to the decision (beroep)');
  assert.match(objection.local, /^Hierbij teken ik beroep aan tegen uw besluit van 05-10-2026\.$/m);
});

test('nl objection words: bezwaar first, no false match on “beroep” or “verzet” in other meanings', () => {
  const word = (text) => analyze(text, { today: TODAY, country: 'nl' }).objection;
  assert.equal(word('U kunt binnen zes weken bezwaar maken. Daarna kunt u in beroep gaan bij de rechtbank.'), 'bezwaar');
  assert.equal(word('U kunt beroep instellen bij de officier van justitie.'), 'beroep');
  assert.equal(word('U kunt verzet doen bij de kantonrechter.'), 'verzet');
  assert.equal(word('Wat is uw beroep? Wij hebben uw afspraak verzet naar een andere dag.'), null);
  assert.equal(netherlands.objection[0].word, 'bezwaar');
});

test('nl dates: payment, deadline and letter date', () => {
  const pay = analyze('Gemeente Utrecht\nDatum: 09-10-2026\nBetaal uiterlijk 30-11-2026.', { today: TODAY, country: 'nl' });
  assert.equal(pay.letterDate, '2026-10-09');
  assert.deepEqual(dateList(pay), [['payment', '2026-11-30']]);
  const deadline = analyze('DUO\nDatum: 09-10-2026\nStuur ons de stukken vóór 30 november 2026.', { today: TODAY, country: 'nl' });
  assert.deepEqual(dateList(deadline), [['deadline', '2026-11-30']]);
});

test('nl dates: “uiterlijk op” is a payment date', () => {
  const result = analyze('Belastingdienst\nDatum: 09-10-2026\nWij moeten het bedrag uiterlijk op 30-11-2026 hebben ontvangen.', { today: TODAY, country: 'nl' });
  assert.deepEqual(dateList(result), [['payment', '2026-11-30']]);
});

test('nl payment reference after “onder vermelding van”', () => {
  const result = analyze('Maak het bedrag over op NL91 ABNA 0417 1643 00 onder vermelding van betalingskenmerk 1234 5678 9012 3456.', { today: TODAY, country: 'nl' });
  assert.equal(result.payment.reference, '1234 5678 9012 3456');
});

test('reads Dutch dates and times', () => {
  assert.equal(findDates('30-11-2026', nl, 'dmy')[0].iso, '2026-11-30');
  assert.equal(findDates('30 november 2026', nl, 'dmy')[0].iso, '2026-11-30');
  assert.equal(findDates('vóór 3 mrt. 2027', nl, 'dmy')[0].iso, '2027-03-03');
  const [appointment] = findDates('op 21-10-2026 om 09:30 uur', nl, 'dmy');
  assert.equal(appointment.iso, '2026-10-21');
  assert.equal(appointment.time, '09:30');
  const [written] = findDates('op woensdag 21 oktober 2026 om 9.30 uur', nl, 'dmy');
  assert.equal(written.iso, '2026-10-21');
  assert.equal(written.time, '09:30');
});

test('reads Dutch deadline phrases', () => {
  const [sixWeeks] = findPeriods('binnen zes weken na de dagtekening', nl);
  assert.equal(sixWeeks.amount, 6);
  assert.equal(sixWeeks.from, 'dagtekening');
  const [fromDate] = findPeriods('binnen 6 weken na de datum van verzending van dit besluit', nl);
  assert.equal(fromDate.amount, 6);
  assert.equal(fromDate.from, 'datum');
  assert.deepEqual(findPeriods('binnen 14 dagen', nl).map((period) => [period.amount, period.unit, period.from]), [[14, 'day', null]]);
  assert.deepEqual(findPeriods('binnen twee dagen', nl).map((period) => [period.amount, period.unit]), [[2, 'day']]);
});

test('reads Dutch deadline phrases in weeks', () => {
  assert.deepEqual(findPeriods('binnen zes weken na de dagtekening', nl).map((period) => [period.amount, period.unit, period.from]), [[6, 'week', 'dagtekening']]);
  assert.deepEqual(findPeriods('binnen vier weken na bekendmaking', nl).map((period) => [period.amount, period.unit]), [[4, 'week']]);
});

test('reads Dutch amounts', () => {
  const amounts = (text) => findMoney(text, netherlands).items.map((item) => item.amount);
  assert.deepEqual(amounts('Te betalen: € 1.234,56'), [1234.56]);
  assert.deepEqual(amounts('Openstaand: 1.234,56 euro'), [1234.56]);
  assert.deepEqual(amounts('Boete: € 25,-'), [25]);
  assert.deepEqual(amounts('Bedrag: EUR 1.234,56'), [1234.56]);
  assert.equal(findMoney('Te betalen: € 1.234,56', netherlands).items[0].currency, 'EUR');
  assert.equal(findMoney('Totaal te betalen: € 1.234,56', netherlands).toPay.amount, 1234.56);
});

test('nl pack shape', () => {
  assert.ok(netherlands.senders.length >= 13 && netherlands.senders.length <= 16);
  assert.ok(netherlands.kinds.length >= 12 && netherlands.kinds.length <= 16);
  assert.ok(netherlands.references.length >= 8 && netherlands.references.length <= 12);
  assert.ok(netherlands.glossary.length >= 35 && netherlands.glossary.length <= 50);
  assert.equal(netherlands.samples.length, 2);
  assert.equal(netherlands.deliveryDays, 0);
  assert.ok(netherlands.intro.includes('Berichtenbox'));
  const types = new Set(['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision']);
  for (const kind of netherlands.kinds) assert.ok(types.has(kind.type), kind.id);
  for (const list of [netherlands.senders, netherlands.glossary]) {
    const slugs = list.map((item) => item.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
  assert.equal(new Set(netherlands.glossary.map((entry) => entry.term)).size, netherlands.glossary.length);
  for (const entry of netherlands.glossary) assert.ok(entry.pattern.test(entry.term), entry.term);
  assert.ok(netherlands.references.some((reference) => reference.payment));
  assert.equal(netherlands.references.find((reference) => reference.local === 'BSN').personal, true);
});
