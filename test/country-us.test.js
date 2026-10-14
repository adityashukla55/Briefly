import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const en = LANGUAGES.en;
const us = countryById('us');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, country: 'us' });
const sample = (id) => run(sampleText('us', id, TODAY));
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const values = (result) => result.references.map((reference) => reference.value);

const COLLECTOR = `ABC Recovery Services
PO Box 1234, Columbus, OH 43215
Date: October 5, 2026
Account number: 556677889

This communication is from a debt collector. This is an attempt to collect a debt.

Validation notice
Original creditor: Example Bank
Total amount of the debt now: $845.20

Call or write to us by November 9, 2026, to dispute all or part of the debt. If you do not, we will assume that our information is correct.`;

const JURY = `Superior Court of California, County of Alameda
Jury Services
Date: October 1, 2026
Juror number: 123456789

Jury Summons

You have been summoned for jury service. Please report on November 16, 2026 at 8:30 a.m.

Complete your qualification questionnaire online by October 26, 2026.`;

test('pack has the expected shape', () => {
  assert.equal(us.id, 'us');
  assert.equal(us.language, 'en');
  assert.equal(us.currency, 'USD');
  assert.equal(us.dateOrder, 'mdy');
  assert.equal(us.deliveryDays, 0);
  assert.ok(us.senders.length >= 13 && us.senders.length <= 16);
  assert.ok(us.kinds.length >= 12 && us.kinds.length <= 16);
  assert.ok(us.references.length >= 8 && us.references.length <= 12);
  assert.ok(us.glossary.length >= 35 && us.glossary.length <= 50);
  assert.equal(us.samples.length, 2);
  for (const kind of us.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [us.senders, us.kinds, us.glossary]) {
    const ids = list.map((item) => item.slug ?? item.id);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...us.senders, ...us.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(new Set(us.glossary.map((entry) => entry.term)).size, us.glossary.length);
  const tested = [...us.signals, ...us.objection.map((entry) => entry.pattern), ...us.glossary.map((entry) => entry.pattern), ...us.senders.flatMap((sender) => sender.patterns), ...us.kinds.flatMap((kind) => kind.patterns)];
  for (const pattern of tested) assert.ok(!pattern.global, String(pattern));
  for (const sender of us.senders) assert.ok(sender.letters.length >= 2 && sender.letters.length <= 4, sender.id);
});

test('IRS CP14: sender, kind, dates, money, references, objection', () => {
  const result = sample('irs');
  assert.equal(result.country.id, 'us');
  assert.equal(result.sender.id, 'irs');
  assert.equal(result.kind.id, 'balance-due');
  assert.equal(result.kind.type, 'reminder');
  assert.equal(result.letterDate, '2026-10-10');
  assert.equal(result.urgency, 'high');

  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.estimated]), [
    ['payment', '2026-11-02', false],
    ['objection', '2026-11-09', true],
  ]);
  assert.equal(result.dates[1].period, '30 days');

  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.money.toPay.currency, 'USD');
  assert.equal(result.payment, null);
  assert.deepEqual(values(result), ['CP14', '2025', 'XXX-XX-1234']);
  assert.equal(result.objection, 'dispute');
  for (const term of ['balance due', 'penalty', 'installment agreement', 'SSN']) {
    assert.ok(result.terms.some((entry) => entry.term === term), term);
  }
});

test('IRS CP14: steps and replies', () => {
  const result = sample('irs');
  const steps = stepText(result);
  assert.match(steps, /First check whether you already paid this/);
  assert.match(steps, /Pay \$1,234\.56 by Mon, Nov 2, 2026\./);
  assert.match(steps, /ask for a payment plan \(installment agreement\) before the deadline/);
  assert.match(steps, /Form 9465/);
  assert.match(steps, /send a written objection \(dispute\) by Mon, Nov 9, 2026 \(estimated\)/);
  assert.match(steps, /Write the notice number CP14 on every reply/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'penalty-relief', 'instalments', 'more-time']);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.equal(objection.title, 'Object to the decision (dispute)');
  assert.match(objection.local, /^Re: Dispute — your notice dated 10\/10\/2026$/m);
  assert.match(objection.local, /Please accept this letter as my dispute\./);
  assert.match(objection.local, /^Tax year: 2025$/m);
  assert.match(objection.local, /^\[City\], 10\/13\/2026$/m);
  const plan = replies.find((reply) => reply.id === 'instalments');
  assert.equal(plan.title, 'Ask to pay in parts (installment agreement)');
  assert.match(plan.local, /Your letter dated 10\/10\/2026 asks me to pay \$1,234\.56\./);
  const relief = replies.find((reply) => reply.id === 'penalty-relief');
  assert.match(relief.local, /About your notice dated 10\/10\/2026: I ask you to remove the penalty/);
  const extension = replies.find((reply) => reply.id === 'more-time');
  assert.match(extension.local, /gives me a deadline of 11\/02\/2026/);
});

test('USCIS biometrics: sender, kind, appointment time, references', () => {
  const result = sample('uscis');
  assert.equal(result.sender.id, 'uscis');
  assert.equal(result.kind.id, 'appointment');
  assert.equal(result.kind.type, 'appointment');
  assert.equal(result.letterDate, '2026-10-09');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-21', '09:30']]);
  assert.equal(result.money.toPay, null);
  assert.equal(result.payment, null);
  assert.equal(result.objection, null);
  assert.deepEqual(values(result), ['IOE0912345678', 'A123456789']);
  assert.ok(result.terms.some((entry) => entry.term === 'biometrics'));

  const steps = stepText(result);
  assert.match(steps, /Go to the appointment on Wed, Oct 21, 2026 at 9:30 a\.m\. Bring/);
  assert.match(steps, /USCIS online account/);
  assert.match(steps, /receipt number IOE0912345678/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.match(replies[0].local, /You scheduled an appointment for me on 10\/21\/2026 at 9:30 a\.m\./);
  assert.match(replies[0].local, /^Receipt Number: IOE0912345678$/m);
});

test('detects the United States from English text, even when Germany is preferred', () => {
  for (const id of ['irs', 'uscis']) {
    const text = sampleText('us', id, TODAY);
    assert.equal(analyze(text, { today: TODAY, preferred: 'de' }).country.id, 'us', id);
    assert.ok(us.signals.filter((signal) => signal.test(text)).length >= 5, id);
  }
});

test('debt collector: validation notice, dispute letter replaces the objection', () => {
  const result = run(COLLECTOR);
  assert.equal(result.sender.id, 'debt-collector');
  assert.equal(result.kind.id, 'debt-validation');
  assert.equal(result.letterDate, '2026-10-05');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso]), [['deadline', '2026-11-09']]);
  assert.equal(result.money.toPay.amount, 845.2);
  assert.equal(result.objection, 'dispute');
  assert.deepEqual(values(result), ['556677889']);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['debt-validation', 'instalments']);
  const dispute = replies[0];
  assert.match(dispute.local, /^Re: Dispute of debt and request for validation$/m);
  assert.match(dispute.local, /I received your letter dated 10\/05\/2026 about a debt of \$845\.20\./);
  assert.match(dispute.local, /stop collecting this debt/);
});

test('jury summons: no objection or extension, citizen letter and reschedule', () => {
  const result = run(JURY);
  assert.equal(result.sender.id, 'court');
  assert.equal(result.kind.id, 'jury');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [
    ['deadline', '2026-10-26', null],
    ['appointment', '2026-11-16', '08:30'],
  ]);
  assert.deepEqual(values(result), ['123456789']);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['jury-not-citizen', 'reschedule']);
  assert.match(replies[0].local, /I received your jury summons dated 10\/01\/2026\./);
  assert.match(stepText(result), /Only US citizens can serve on a jury/);
});

test('senders and kinds in short US letters', () => {
  const cases = [
    ['Internal Revenue Service\nFinal Notice\nNotice of intent to levy and notice of your right to a hearing\nLetter 1058', 'irs', 'levy'],
    ['Internal Revenue Service\nNotice: CP2000\nProposed changes to your 2024 Form 1040\nThe income information we received from third parties doesn’t match your tax return.\nProposed amount due: $2,481.00', 'irs', 'proposed-changes'],
    ['Internal Revenue Service\nNotice: CP12\nWe corrected one or more mistakes on your 2025 Form 1040. Your refund is different from what you expected.', 'irs', 'refund-change'],
    ['Internal Revenue Service\nLetter 5071C\nWe need to verify your identity before we can process your tax return.', 'irs', 'documents'],
    ['Franchise Tax Board\nNotice of Proposed Assessment\nProposed tax: $620.00', 'state-tax', 'proposed-changes'],
    ['Social Security Administration\nNotice of Overpayment\nWe paid you $1,200.00 too much in Social Security benefits.', 'ssa', 'overpayment'],
    ['Social Security Administration\nNotice of Award\nYour monthly benefit amount is $1,450.00.', 'ssa', 'approval'],
    ['U.S. Citizenship and Immigration Services\nRequest for Evidence\nSubmit the evidence requested below by 01/05/2027.', 'uscis', 'rfe'],
    ['U.S. Citizenship and Immigration Services\nForm I-797, Notice of Action\nApproval Notice\nYour Form I-765 has been approved.', 'uscis', 'approval'],
    ['USCIS\nDecision\nAfter a thorough review, your Form I-485 is denied.', 'uscis', 'denial'],
    ['Superior Court of California, County of Los Angeles\nSummons\nNotice to defendant: You are being sued by plaintiff.', 'court', 'summons'],
    ['Maple Street Property Management\nThree-Day Notice to Pay Rent or Quit\nTo: tenant at 12 Example St, Apt 3', 'landlord', 'eviction'],
    ['City Power & Light\nElectric service\nYour bill\nService address: 12 Example St\nTotal amount due: $84.20\nDue date: 11/05/2026', 'utility', 'bill'],
    ['County Department of Human Services\nSNAP recertification\nWe need more information to renew your benefits. Please send the following documents.', 'benefits', 'documents'],
    ['California Employment Development Department\nNotice of Determination\nYou are not eligible for unemployment insurance benefits.', 'unemployment', 'denial'],
    ['Example Loan Servicing\nYour federal student loan\nMonthly payment: $212.00\nDue date: 11/15/2026', 'student-loans', 'bill'],
    ['Example County Treasurer-Tax Collector\nSecured Property Tax Bill\nParcel number: 123-456-789', 'property-tax', 'bill'],
    ['City of Chicago Department of Finance\nParking Ticket\nCitation number: 9187654321\nFine amount: $60.00', 'parking', 'ticket'],
  ];
  for (const [text, sender, kind] of cases) {
    const result = run(text);
    assert.equal(result.sender?.id, sender, text);
    assert.equal(result.kind?.id, kind, text);
  }
  assert.equal(run('Department of Motor Vehicles\nVehicle registration renewal notice').sender.id, 'dmv');
  const eob = run('Example Health Plan\nExplanation of Benefits\nTHIS IS NOT A BILL\nMember ID: XYZ123456789');
  assert.equal(eob.sender.id, 'health');
  assert.equal(eob.kind, null);
  assert.deepEqual(values(eob), ['XYZ123456789']);
});

test('template letters use US placeholders', () => {
  const [objection, moreTime, instalments, reschedule] = templateLetters(us);
  assert.equal(objection.title, 'Object to the decision (appeal)');
  assert.match(objection.local, /Re: Appeal — your notice dated \[date of the letter\]/);
  assert.match(objection.local, /^\[City\], \[MM\/DD\/YYYY\]$/m);
  assert.match(moreTime.local, /Re: Request for an extension/);
  assert.equal(instalments.title, 'Ask to pay in parts (installment agreement)');
  assert.match(reschedule.local, /on \[date\] at \[time\]/);
});

test('US dates and times', () => {
  assert.equal(findDates('Please pay by 11/12/2026', en, 'mdy')[0].iso, '2026-11-12');
  assert.equal(findDates('Pay by November 12, 2026', en, 'mdy')[0].iso, '2026-11-12');
  assert.equal(findDates('Respond by Nov. 12, 2026', en, 'mdy')[0].iso, '2026-11-12');
  const [morning] = findDates('on October 21, 2026 at 9:30 a.m.', en, 'mdy');
  assert.equal(morning.iso, '2026-10-21');
  assert.equal(morning.time, '09:30');
  const [afternoon] = findDates('Hearing: December 1, 2026 at 2:15 PM', en, 'mdy');
  assert.equal(afternoon.iso, '2026-12-01');
  assert.equal(afternoon.time, '14:15');
  const [noon] = findDates('Date: 10/21/2026, 12:00 p.m.', en, 'mdy');
  assert.equal(noon.time, '12:00');
});

test('US periods', () => {
  const [thirty] = findPeriods('within 30 days from the date of this notice', en);
  assert.equal(thirty.amount, 30);
  assert.equal(thirty.unit, 'day');
  assert.equal(thirty.from, 'date');
  const [sixty] = findPeriods('You can appeal within 60 days.', en);
  assert.equal(sixty.amount, 60);
  assert.equal(sixty.unit, 'day');
  assert.equal(sixty.from, null);
});

test('US amounts', () => {
  for (const text of ['Amount due: $1,234.56', 'Amount due: USD 1,234.56', 'Amount due: 1,234.56 dollars', 'Amount due: US$1,234.56']) {
    const [item] = findMoney(text, us).items;
    assert.equal(item.amount, 1234.56, text);
    assert.equal(item.currency, 'USD', text);
    assert.equal(item.role, 'pay', text);
  }
  assert.equal(findMoney('Fine amount: $60', us).items[0].amount, 60);
});
