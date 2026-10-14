import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-14';
const uk = countryById('uk');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, preferred: 'de' });
const sample = (id) => analyze(sampleText('uk', id, TODAY), { today: TODAY, country: 'uk' });
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const dates = (result) => result.dates.map((date) => [date.type, date.iso]);

test('pack has the expected shape', () => {
  assert.equal(uk.slug, 'united-kingdom');
  assert.equal(uk.language, 'en');
  assert.equal(uk.currency, 'GBP');
  assert.equal(uk.dateOrder, 'dmy');
  assert.ok(uk.senders.length >= 13 && uk.senders.length <= 16);
  assert.ok(uk.kinds.length >= 12 && uk.kinds.length <= 20);
  assert.ok(uk.references.length >= 8 && uk.references.length <= 12);
  assert.ok(uk.glossary.length >= 35 && uk.glossary.length <= 55);
  assert.equal(uk.samples.length, 2);
  for (const kind of uk.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [uk.senders, uk.kinds, uk.glossary]) {
    const ids = list.map((item) => item.id ?? item.slug);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...uk.senders, ...uk.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const stateless = [...uk.signals, ...uk.objection.map((entry) => entry.pattern), ...uk.glossary.map((entry) => entry.pattern), ...[...uk.senders, ...uk.kinds].flatMap((item) => item.patterns)];
  for (const pattern of stateless) assert.ok(!pattern.global, String(pattern));
  assert.ok(uk.references.some((reference) => reference.local === 'National Insurance number' && reference.personal));
  const english = [uk.intro, uk.deliveryNote, uk.objectionAdvice, ...uk.senders.flatMap((sender) => [sender.name, sender.about, ...sender.tips]), ...uk.kinds.flatMap((kind) => [kind.name, kind.about, ...(kind.steps ?? [])]), ...uk.glossary.flatMap((entry) => [entry.meaning, entry.tip ?? ''])];
  for (const text of english) assert.ok(!text.includes('\''), text);
});

test('HMRC sample: tax to pay, sort code, reference and 60 days to disagree', () => {
  const result = sample('hmrc');
  assert.equal(result.sender.id, 'hmrc');
  assert.equal(result.kind.id, 'tax-calculation');
  assert.equal(result.letterDate, '2026-10-11');
  assert.deepEqual(dates(result), [['objection', '2026-12-10'], ['payment', '2027-01-31']]);
  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.money.toPay.currency, 'GBP');
  assert.equal(result.payment.iban, null);
  assert.equal(result.payment.account.text, 'sort code 12-34-56, account number 12345678');
  assert.equal(result.payment.reference, '1234567890K');
  assert.equal(result.payment.recipient, 'HMRC Example Account');
  const steps = stepText(result);
  assert.match(steps, /Pay £1,234\.56 by Sun, 31 Jan 2027 to sort code 12-34-56, account number 12345678\./);
  assert.match(steps, /written objection \(appeal\)/);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments', 'more-time']);
  assert.match(replies[0].local, /Yours faithfully,/);
  assert.match(replies[0].local, /dated 11\/10\/2026/);
  assert.match(replies[1].local, /£1,234\.56/);
  assert.match(replies[1].local, /instalments/);
});

test('Jobcentre sample: appointment with time, no objection letter', () => {
  const result = sample('jobcentre');
  assert.equal(result.sender.id, 'dwp');
  assert.equal(result.kind.id, 'appointment');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-22', '09:30']]);
  assert.deepEqual(buildReplies(result).map((reply) => reply.id), ['reschedule']);
  assert.equal(result.references[0].value, 'QQ 98 76 54 A');
});

test('samples are detected as UK letters without picking the country', () => {
  for (const id of ['hmrc', 'jobcentre']) assert.equal(run(sampleText('uk', id, TODAY)).country.id, 'uk');
});

test('council PCN: 14-day discount, 28 days to challenge, challenge letter', () => {
  const result = run(`London Borough of Example
Parking Services
PCN number: EX12345678
Date of notice: 12/10/2026
Vehicle registration: AB12 CDE

Penalty Charge Notice
The penalty charge is £160.00. If you pay within 14 days of the date of this notice, the charge is reduced to £80.00.
If you want to challenge this PCN, write to us within 28 days.`);
  assert.equal(result.country.id, 'uk');
  assert.equal(result.kind.id, 'pcn');
  assert.deepEqual(dates(result), [['payment', '2026-10-26'], ['objection', '2026-11-11']]);
  assert.deepEqual(result.references.map((reference) => reference.value), ['EX12345678', 'AB12 CDE']);
  assert.equal(buildReplies(result)[0].id, 'pcn-challenge');
});

test('speeding notice: offence date is not an appointment', () => {
  const result = run(`Example Constabulary
Notice of Intended Prosecution
Date: 10 October 2026
Our reference: 26/123456
The vehicle was detected travelling at 38 mph in a 30 mph limit on 3 October 2026 at 14:22.
You are required under section 172 of the Road Traffic Act 1988 to give information about who was driving within 28 days of the date of service of this notice.`);
  assert.equal(result.kind.id, 'nip');
  assert.deepEqual(dates(result), [['deadline', '2026-11-07']]);
  assert.match(stepText(result), /Fill in who was driving/);
});

test('DWP overpayment: mandatory reconsideration within one month', () => {
  const result = run(`Department for Work and Pensions
Date: 7 October 2026
National Insurance number: QQ 11 22 33 B
Universal Credit overpayment
We have decided that you were paid too much Universal Credit. The overpayment is £845.20.
If you disagree with this decision, you can ask for a mandatory reconsideration within one month of the date of this letter.
We will recover the overpayment by taking £60.00 a month from your Universal Credit.`);
  assert.equal(result.kind.id, 'overpayment');
  assert.equal(result.objection, 'mandatory reconsideration');
  assert.deepEqual(dates(result), [['objection', '2026-11-07']]);
  assert.equal(result.money.toPay.amount, 845.2);
  assert.equal(buildReplies(result)[0].id, 'mandatory-reconsideration');
});

test('council tax reminder: pay the missed instalment, bank details after the sort code', () => {
  const result = run(`Example City Council
Council Tax Reminder Notice
Date: 5 October 2026
Council tax account number: 50012345
Please pay £148.00 within 7 days of the date of this notice. If you do not, the full balance of £1,184.00 will become due.
Sort code: 12-34-56 Account number: 87654321 Payment reference: 50012345`);
  assert.equal(result.kind.id, 'reminder');
  assert.equal(result.money.toPay.amount, 148);
  assert.equal(result.payment.account.text, 'sort code 12-34-56, account number 87654321');
});

test('court claim form: 14 days after service, no objection letter', () => {
  const result = run(`Claim Form
In the County Court Business Centre
Claim number: K1QZ1234
Issue date: 9 October 2026
Total amount: £2,565.00
You must respond within 14 days of service.`);
  assert.equal(result.kind.id, 'claim-form');
  assert.deepEqual(dates(result), [['deadline', '2026-10-25']]);
  assert.ok(!buildReplies(result).some((reply) => reply.id === 'objection'));
});

test('UK money and numeric dates are day-first', () => {
  assert.equal(findMoney('Amount due: £1,234.56', uk).toPay.amount, 1234.56);
  const result = run('HM Revenue and Customs\nDate: 02/10/2026\nPay by: 03/11/2026\nAmount due: £50.00');
  assert.equal(result.letterDate, '2026-10-02');
  assert.deepEqual(dates(result), [['payment', '2026-11-03']]);
});

test('template letters use British style', () => {
  const letters = templateLetters(uk);
  assert.ok(letters.length >= 4);
  for (const letter of letters) assert.match(letter.local, /Yours faithfully,/);
  assert.match(letters.find((letter) => letter.id === 'instalments').local, /instalments/);
});
