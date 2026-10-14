import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const en = LANGUAGES.en;
const canada = countryById('ca');

test('CRA reassessment: sender, kind, dates, money, references, objection', () => {
  const result = analyze(sampleText('ca', 'cra', TODAY), { today: TODAY, country: 'ca' });
  assert.equal(result.country.id, 'ca');
  assert.equal(result.sender.id, 'cra');
  assert.equal(result.kind.id, 'assessment');
  assert.equal(result.kind.type, 'tax-assessment');
  assert.equal(result.letterDate, '2026-10-09');
  assert.equal(result.urgency, 'medium');

  assert.deepEqual(result.dates.map((date) => date.type), ['payment', 'objection']);
  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.iso, '2026-11-12');
  assert.equal(payment.estimated, false);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.iso, '2027-01-07');
  assert.equal(objection.estimated, true);
  assert.equal(objection.period, '90 days');

  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.money.toPay.currency, 'CAD');
  assert.equal(result.payment, null);

  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [['SIN', 'XXX XX4 321']]);
  assert.equal(result.objection, 'notice of objection');
  assert.ok(result.terms.some((term) => term.term === 'notice of reassessment'));
  assert.ok(result.terms.some((term) => term.term === 'payment arrangement'));
});

test('CRA reassessment: steps and replies', () => {
  const result = analyze(sampleText('ca', 'cra', TODAY), { today: TODAY, country: 'ca' });
  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Pay \$1,234\.56 by Thu, Nov 12, 2026\./);
  assert.match(steps, /ask for a payment plan \(a payment arrangement\)/);
  assert.match(steps, /send a written objection \(notice of objection\) by Thu, Jan 7, 2027 \(estimated\)/);
  assert.match(steps, /later of: 90 days after the date of the notice, or 1 year after your filing due date/);
  assert.match(steps, /social insurance number \(SIN\) XXX XX4 321/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'taxpayer-relief', 'instalments', 'more-time']);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.equal(objection.title, 'Object to the decision (notice of objection)');
  assert.match(objection.local, /^Re: Notice of objection — your decision dated 2026-10-09$/m);
  assert.match(objection.local, /Please accept this letter as my notice of objection about your decision dated 2026-10-09\./);
  assert.match(objection.local, /^SIN: XXX XX4 321$/m);
  assert.match(objection.local, /^\[Canada Revenue Agency \(CRA\)\]$/m);
  assert.match(objection.local, /^\[City\], 2026-10-13$/m);

  const relief = replies.find((reply) => reply.id === 'taxpayer-relief');
  assert.match(relief.local, /Your notice dated 2026-10-09 shows a balance owing of \$1,234\.56\./);
  const instalments = replies.find((reply) => reply.id === 'instalments');
  assert.match(instalments.local, /asks me to pay \$1,234\.56\./);
});

test('IRCC interview: date, time, references and reply', () => {
  const result = analyze(sampleText('ca', 'ircc', TODAY), { today: TODAY, country: 'ca' });
  assert.equal(result.sender.id, 'ircc');
  assert.equal(result.kind.id, 'interview');
  assert.equal(result.kind.type, 'appointment');
  assert.equal(result.letterDate, '2026-10-07');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-21', '09:30']]);
  assert.equal(result.money.toPay, null);
  assert.equal(result.payment, null);
  assert.equal(result.objection, null);
  assert.deepEqual(result.references.map((reference) => [reference.local, reference.value]), [['UCI', '1234-5678'], ['Application number', 'E001234567']]);

  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Go to the appointment on Wed, Oct 21, 2026 at 9:30 a\.m\. Bring/);
  assert.match(steps, /unique client identifier \(UCI\) 1234-5678/);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.match(replies[0].local, /on 2026-10-21 at 9:30 a\.m\./);
  assert.match(replies[0].local, /^UCI: 1234-5678$/m);
});

test('detects Canada from English text with Canadian signals, not the United States', () => {
  for (const id of ['cra', 'ircc']) {
    for (const preferred of ['de', 'us']) {
      const result = analyze(sampleText('ca', id, TODAY), { today: TODAY, preferred });
      assert.equal(result.country.id, 'ca', `${id} with ${preferred} preferred`);
    }
  }
});

test('senders and kinds in short Canadian letters', () => {
  const cases = [
    ['Canada Revenue Agency\nStatement of account\nBalance owing: $845.20\nPlease pay by 2026-11-02.', 'cra', 'statement'],
    ['Canada Revenue Agency\nLegal warning\nIf you do not pay $2,310.00 now, we may take legal action without further notice, including garnishing your wages.', 'cra', 'legal-warning'],
    ['Canada Revenue Agency\nWe are reviewing your 2025 income tax and benefit return. Please send us copies of your receipts for child care expenses by November 12, 2026.', 'cra', 'review'],
    ['Service Canada\nNotice of debt\nYou were overpaid Employment Insurance benefits. Amount you owe: $1,020.00', 'service-canada', 'overpayment'],
    ['Service Canada\nDecision on your Employment Insurance claim\nIf you disagree with this decision, you can ask for a reconsideration within 30 days after the decision was communicated to you.', 'service-canada', 'decision'],
    ['Immigration, Refugees and Citizenship Canada\nBiometric instruction letter\nYou must give your biometrics within 30 days of the date of this letter.', 'ircc', 'biometrics'],
    ['IRCC\nProcedural fairness letter\nThe officer has concerns that you may not meet the requirements for a work permit.', 'ircc', 'fairness'],
    ['Immigration, Refugees and Citizenship Canada\nYour application for a study permit has been refused.', 'ircc', 'refusal'],
    ['Ontario Court of Justice\nProvincial Offences Act\nOffence Notice\nHighway Traffic Act — speeding\nSet fine: $95.00', 'traffic-court', 'ticket'],
    ['City of Toronto\nParking Violation Notice\nPenalty amount: $30.00', 'bylaw', 'ticket'],
    ['Superior Court of Justice\nSmall Claims Court\nPlaintiff’s Claim\nYou are being sued.', 'court', 'court-claim'],
    ['Maple Property Management\nN4 Notice to End your Tenancy Early for Non-payment of Rent\nTermination date: 2026-11-01', 'landlord', 'eviction'],
    ['Toronto Hydro\nYour bill\nElectricity charges: $84.20\nkWh used: 520\nDue date: 2026-11-05', 'utility', 'utility-bill'],
    ['ABC Collections Inc.\nYour account has been placed with our collection agency on behalf of our client.\nOutstanding balance: $412.00', 'collection-agency', 'statement'],
    ['National Student Loans Service Centre\nYour Repayment Assistance Plan application has been approved.', 'student-aid', 'approval'],
    ['WSIB\nWorkplace Safety and Insurance Board\nWe are pleased to tell you that your claim has been approved.', 'workers-comp', 'approval'],
    ['City of Ottawa\nFinal tax bill 2026\nProperty tax\nAmount due: $1,450.00\nDue date: 2026-11-20', 'property-tax', 'bill'],
    ['Ministry of Finance\nEmployer Health Tax\nStatement of account\nBalance: $310.00', 'provincial-finance', 'statement'],
  ];
  for (const [text, sender, kind] of cases) {
    const result = analyze(text, { today: TODAY, country: 'ca' });
    assert.equal(result.sender?.id, sender, text);
    assert.equal(result.kind?.id, kind, text);
  }
  assert.equal(analyze('ServiceOntario\nMinistry of Health\nYour OHIP health card will expire soon.', { today: TODAY, country: 'ca' }).sender.id, 'health-insurance');
  assert.equal(analyze('ServiceOntario\nYour driver’s licence will expire soon. Renew it online.', { today: TODAY, country: 'ca' }).sender.id, 'licensing');
});

test('deadlines count from the date on the letter', () => {
  const biometrics = analyze('Immigration, Refugees and Citizenship Canada\nDate: 2026-10-09\nBiometric instruction letter\nYou must give your biometrics within 30 days of the date of this letter.', { today: TODAY, country: 'ca' });
  assert.equal(biometrics.letterDate, '2026-10-09');
  assert.deepEqual(biometrics.dates.map((date) => [date.type, date.iso]), [['deadline', '2026-11-08']]);

  const ei = analyze('Service Canada\nDate: October 9, 2026\nDecision on your Employment Insurance claim\nIf you disagree with this decision, you can ask for a reconsideration within 30 days after the decision was communicated to you.', { today: TODAY, country: 'ca' });
  assert.equal(ei.objection, 'request for reconsideration');
  assert.deepEqual(ei.dates.map((date) => [date.type, date.iso]), [['objection', '2026-11-08']]);
});

test('Canadian dates', () => {
  assert.equal(findDates('Pay by: 2026-11-12', en, 'ymd')[0].iso, '2026-11-12');
  assert.equal(findDates('November 12, 2026', en, 'ymd')[0].iso, '2026-11-12');
  assert.equal(findDates('Date issued: Oct 9, 2026', en, 'ymd')[0].iso, '2026-10-09');
  const [appointment] = findDates('on October 21, 2026 at 9:30 a.m.', en, 'ymd');
  assert.equal(appointment.iso, '2026-10-21');
  assert.equal(appointment.time, '09:30');
  assert.equal(findDates('on 2026-10-21 at 2:15 p.m.', en, 'ymd')[0].time, '14:15');
});

test('Canadian periods', () => {
  const [ninety] = findPeriods('within 90 days after the date of this notice', en);
  assert.equal(ninety.amount, 90);
  assert.equal(ninety.unit, 'day');
  assert.equal(ninety.from, 'date');
  const [thirty] = findPeriods('within 30 days', en);
  assert.equal(thirty.amount, 30);
  assert.equal(thirty.unit, 'day');
  assert.equal(thirty.from, null);
});

test('Canadian amounts', () => {
  for (const text of ['Balance owing: $1,234.56', 'Balance owing: CAD 1,234.56', 'Balance owing: C$1,234.56', 'Balance owing: CA$1,234.56']) {
    const money = findMoney(text, canada);
    assert.equal(money.items[0].amount, 1234.56, text);
    assert.equal(money.items[0].currency, 'CAD', text);
    assert.equal(money.toPay.amount, 1234.56, text);
  }
  assert.deepEqual(findMoney('Total income (line 15000): 52,480.00', canada).items, []);
});

test('pack shape: sizes, unique slugs and valid kind types', () => {
  const types = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];
  for (const kind of canada.kinds) assert.ok(types.includes(kind.type), kind.id);
  for (const list of [canada.senders, canada.glossary]) {
    const slugs = list.map((item) => item.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
  assert.equal(new Set(canada.senders.map((sender) => sender.id)).size, canada.senders.length);
  assert.equal(new Set(canada.kinds.map((kind) => kind.id)).size, canada.kinds.length);
  assert.equal(new Set(canada.glossary.map((entry) => entry.term)).size, canada.glossary.length);
  assert.ok(canada.senders.length >= 13 && canada.senders.length <= 16);
  assert.ok(canada.kinds.length >= 12 && canada.kinds.length <= 16);
  assert.ok(canada.references.length >= 8 && canada.references.length <= 12);
  assert.ok(canada.glossary.length >= 35 && canada.glossary.length <= 50);
  for (const sender of canada.senders) {
    assert.ok(sender.letters.length >= 2 && sender.letters.length <= 4, sender.id);
    assert.ok(sender.tips.length >= 1 && sender.tips.length <= 2, sender.id);
  }
  assert.equal(canada.samples.length, 2);
  assert.equal(canada.ibanLength, 0);
  assert.equal(canada.deliveryDays, 0);
});
