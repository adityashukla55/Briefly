import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze } from '../web/src/analyze.js';
import documents from './fixtures/documents.js';

const TODAY = '2026-10-16';

function read(doc) {
  const result = analyze(doc.text, { country: doc.country, today: TODAY });
  return {
    result,
    pay: result.money.toPay?.amount ?? null,
    deadline: result.dates.filter((date) => date.iso && ['deadline', 'payment', 'appointment'].includes(date.type)).map((date) => date.iso).sort()[0] ?? null,
  };
}

for (const doc of documents) {
  test(`${doc.id}: ${doc.expect.pay === null ? 'nothing to pay' : `pay ${doc.expect.pay}`}, deadline ${doc.expect.deadline ?? 'none'}`, () => {
    const { pay, deadline } = read(doc);
    if (doc.expect.pay === null) assert.equal(pay, null, `${doc.id} shows money to pay`);
    else assert.ok(pay !== null && Math.abs(pay - doc.expect.pay) < 0.01, `${doc.id}: ${pay} instead of ${doc.expect.pay}`);
    assert.equal(deadline, doc.expect.deadline);
  });
}

test('says when a document asks for nothing', () => {
  for (const id of ['de-electricity-direct-debit', 'de-insurance-info', 'en-irs-refund', 'en-energy-credit', 'fr-edf-direct-debit']) {
    const { result } = read(documents.find((doc) => doc.id === id));
    assert.equal(result.nothing, true, id);
    assert.equal(result.urgency, 'low', id);
  }
});

test('names bank statements and payslips', () => {
  assert.equal(read(documents.find((doc) => doc.id === 'de-bank-statement')).result.kind.type, 'bank-statement');
  assert.equal(read(documents.find((doc) => doc.id === 'en-bank-statement')).result.kind.type, 'bank-statement');
  assert.equal(read(documents.find((doc) => doc.id === 'de-payslip')).result.kind.type, 'payslip');
});

test('keeps the sentence that asks for the money', () => {
  const { result } = read(documents.find((doc) => doc.id === 'de-reminder'));
  assert.match(result.money.toPay.asked, /Bitte überweisen Sie den Gesamtbetrag/);
  assert.ok(result.asks.some((sentence) => /Bitte überweisen/.test(sentence)));
});
