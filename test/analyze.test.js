import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, isValidIban } from '../web/src/analyze.js';

const sampleText = (id, today) => countrySample('de', id, today);
import { makeIcs } from '../web/src/calendar.js';
import { buildReplies } from '../web/src/replies.js';
import { sampleText as countrySample } from '../web/src/countries/index.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';

test('tax letter: sender, kind, payment and objection deadline', () => {
  const result = analyze(sampleText('tax', TODAY), { today: TODAY });
  assert.equal(result.sender.id, 'finanzamt');
  assert.equal(result.kind.id, 'steuerbescheid');
  assert.equal(result.letterDate, '2026-10-10');
  assert.equal(result.money.toPay.amount, 412);
  assert.equal(result.payment.iban, 'DE89 3704 0044 0532 0130 00');
  assert.equal(result.payment.bic, 'COBADEFFXXX');
  assert.equal(result.objection, 'Einspruch');

  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.iso, '2026-11-11');
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.iso, '2026-11-14');
  assert.equal(objection.estimated, true);

  assert.ok(result.references.some((reference) => reference.value === '214/123/45678'));
  assert.ok(result.terms.some((term) => term.term === 'Einspruch'));
});

test('jobcenter letter: appointment with time', () => {
  const result = analyze(sampleText('jobcenter', TODAY), { today: TODAY });
  assert.equal(result.sender.id, 'jobcenter');
  assert.equal(result.kind.id, 'einladung');
  const appointment = result.dates.find((date) => date.type === 'appointment');
  assert.equal(appointment.iso, '2026-10-21');
  assert.equal(appointment.time, '09:30');
  assert.ok(result.references.some((reference) => reference.value === '05301//0012345'));
  assert.equal(result.money.toPay, null);
  const steps = buildSteps(result).map((step) => step.text).join(' ');
  assert.match(steps, /Go to the appointment on Wed, 21 Oct 2026 at 09:30/);
  assert.ok(buildReplies(result).some((reply) => reply.id === 'reschedule'));
});

test('fee letter: payment reminder, period dates are not deadlines', () => {
  const result = analyze(sampleText('fee', TODAY), { today: TODAY });
  assert.equal(result.sender.id, 'rundfunk');
  assert.equal(result.kind.id, 'mahnung');
  assert.equal(result.money.toPay.amount, 55.08);
  assert.deepEqual(result.dates.map((date) => date.type), ['payment']);
  assert.equal(result.dates[0].iso, '2026-10-23');
  assert.equal(result.urgency, 'high');
  assert.ok(result.references.some((reference) => reference.value === '123 456 789'));
});

test('refund is good news, not a payment', () => {
  const result = analyze('Finanzamt Dresden\nDatum: 01.10.2026\nEinkommensteuerbescheid\nErstattung: 230,50 €\nDer Betrag wird auf Ihr Konto überwiesen.', { today: TODAY });
  assert.equal(result.money.toPay, null);
  assert.equal(result.money.toGet.amount, 230.5);
  assert.match(buildSteps(result)[0].text, /you get €230.50 back/);
});

test('repayment demand counts "Erstattung" as money to pay', () => {
  const result = analyze('Jobcenter Berlin\nDatum: 01.10.2026\nAufhebungs- und Erstattungsbescheid\nDer Betrag von 640,00 € ist von Ihnen zu erstatten.', { today: TODAY });
  assert.equal(result.kind.id, 'rueckforderung');
  assert.equal(result.money.toPay.amount, 640);
});

test('enforcement is always urgent', () => {
  const result = analyze('Hauptzollamt\nVollstreckungsankündigung\nOffene Forderung: 1.250,00 €', { today: TODAY });
  assert.equal(result.kind.id, 'vollstreckung');
  assert.equal(result.urgency, 'high');
  assert.equal(result.money.toPay.amount, 1250);
});

test('joins words split across lines by OCR', () => {
  const result = analyze('Der Widerspruch ist innerhalb eines Monats nach Bekannt-\ngabe einzulegen.\nDatum: 01.10.2026', { today: TODAY });
  assert.ok(result.terms.some((term) => term.term === 'Bekanntgabe'));
});

test('IBAN checksum', () => {
  assert.equal(isValidIban('DE89 3704 0044 0532 0130 00'), true);
  assert.equal(isValidIban('DE89 3704 0044 0532 0130 01'), false);
});

test('calendar file has an all-day event with a reminder', () => {
  const ics = makeIcs({ title: 'Pay tax, Finanzamt', iso: '2026-11-11', description: 'Pay €412.00', now: new Date('2026-10-13T10:00:00Z') });
  assert.match(ics, /DTSTART;VALUE=DATE:20261111/);
  assert.match(ics, /DTEND;VALUE=DATE:20261112/);
  assert.match(ics, /SUMMARY:Pay tax\\, Finanzamt/);
  assert.match(ics, /TRIGGER:-P2D/);
});

test('objection reply uses Einspruch for the tax office', () => {
  const result = analyze(sampleText('tax', TODAY), { today: TODAY });
  const reply = buildReplies(result).find((item) => item.id === 'objection');
  assert.match(reply.local, /hiermit lege ich Einspruch gegen Ihren Bescheid vom 10\.10\.2026 ein/);
  assert.match(reply.local, /Steuernummer: 214\/123\/45678/);
});
