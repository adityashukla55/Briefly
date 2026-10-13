import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const es = LANGUAGES.es;
const spain = countryById('es');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, country: 'es' });
const sample = (id) => run(sampleText('es', id, TODAY));
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const values = (result) => result.references.map((reference) => reference.value);

const PROPUESTA = `Agencia Tributaria
NIF: X1234567L
Fecha: 05/10/2026

Propuesta de liquidación provisional
Impuesto sobre la Renta de las Personas Físicas (IRPF) · Ejercicio 2025

Importe a ingresar según la propuesta: 640,00 €

Puede presentar alegaciones y aportar los documentos que considere oportunos en el plazo de diez días hábiles contados desde el día siguiente a la notificación de esta propuesta.`;

const REQUERIMIENTO = `Oficina de Extranjería de Barcelona
NIE: Z1234567R
Número de expediente: 080020260054321
Fecha: 07/10/2026

Requerimiento de documentación

En relación con su solicitud, le requerimos para que en el plazo de diez días hábiles aporte los siguientes documentos: contrato de trabajo firmado y certificado de empadronamiento. Si no lo hiciera, se le tendrá por desistido de su petición.`;

const DGT = `Dirección General de Tráfico
Jefatura Provincial de Tráfico de Valencia
Fecha: 06/10/2026
Número de boletín de denuncia: 4602612345678

Notificación de denuncia
Hecho denunciado: circular a 72 km/h en una vía limitada a 50 km/h.
Importe de la multa: 100 €

Puede formular alegaciones en el plazo de veinte días naturales contados desde el día siguiente a la notificación. Si paga en ese plazo, el importe se reduce un 50%: 50 €.`;

test('pack has the expected shape', () => {
  assert.equal(spain.id, 'es');
  assert.equal(spain.language, 'es');
  assert.ok(spain.senders.length >= 12 && spain.senders.length <= 16);
  assert.ok(spain.kinds.length >= 12 && spain.kinds.length <= 16);
  assert.ok(spain.references.length >= 8 && spain.references.length <= 12);
  assert.ok(spain.glossary.length >= 35 && spain.glossary.length <= 50);
  assert.equal(spain.samples.length, 2);
  for (const kind of spain.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const item of [...spain.senders, ...spain.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const list of [spain.senders, spain.kinds, spain.glossary]) {
    assert.equal(new Set(list.map((item) => item.id ?? item.slug)).size, list.length);
  }
  const stateless = [...spain.signals, ...spain.objection.map((entry) => entry.pattern), ...spain.glossary.map((entry) => entry.pattern), ...[...spain.senders, ...spain.kinds].flatMap((item) => item.patterns)];
  for (const pattern of stateless) assert.ok(!pattern.global, String(pattern));
  assert.ok(spain.references.some((reference) => reference.payment));
});

test('tax sample: assessment with payment date, IBAN and one-month appeal', () => {
  const result = sample('tax');
  assert.equal(result.sender.id, 'aeat');
  assert.equal(result.kind.id, 'liquidacion');
  assert.equal(result.kind.type, 'tax-assessment');
  assert.equal(result.letterDate, '2026-10-08');
  assert.equal(result.objection, 'recurso de reposición');

  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.iso, '2026-11-20');
  assert.equal(payment.estimated, false);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.iso, '2026-11-11');
  assert.equal(objection.estimated, true);
  assert.equal(objection.period, '1 month');

  assert.equal(result.money.toPay.amount, 1234.56);
  assert.equal(result.money.toPay.currency, 'EUR');
  assert.equal(result.payment.iban, 'ES91 2100 0418 4502 0005 1332');
  assert.equal(result.payment.bic, 'CAIXESBBXXX');
  assert.equal(result.payment.reference, '0212345678901');
  assert.ok(isValidIban(result.payment.iban));

  assert.deepEqual(values(result), ['2026GRC28012345', 'X1234567L', 'A2860026506000123', 'ABCD1234EFGH5678', '0212345678901']);
  assert.equal(result.references.find((reference) => reference.value === '0212345678901').payment, true);
  assert.ok(result.terms.some((term) => term.term === 'Recurso de reposición'));
});

test('tax sample: steps and replies', () => {
  const result = sample('tax');
  const steps = stepText(result);
  assert.match(steps, /Pay €1,234\.56 by Fri, 20 Nov 2026 to the account ES91 2100 0418 4502 0005 1332\./);
  assert.match(steps, /payment plan \(aplazamiento o fraccionamiento\)/);
  assert.match(steps, /written objection \(recurso de reposición\) by Wed, 11 Nov 2026 \(estimated\)/);
  assert.match(steps, /Write the case number \(Número de expediente\) 2026GRC28012345 on every reply/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments']);
  assert.match(replies[0].when, /Give your reasons and add proof/);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.match(objection.local, /Asunto: Recurso de reposición contra su resolución de fecha 08\/10\/2026/);
  assert.match(objection.local, /Por medio del presente escrito interpongo recurso de reposición contra su resolución de fecha 08\/10\/2026\./);
  assert.match(objection.local, /NIF: X1234567L/);
  assert.match(replies.find((reply) => reply.id === 'instalments').local, /me requieren el pago de 1234,56\s€/);
});

test('immigration sample: appointment with time', () => {
  const result = sample('extranjeria');
  assert.equal(result.sender.id, 'extranjeria');
  assert.equal(result.kind.id, 'citacion');
  assert.equal(result.kind.type, 'appointment');
  assert.equal(result.letterDate, '2026-10-09');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-21', '09:30']]);
  assert.equal(result.money.toPay, null);
  assert.equal(result.payment, null);
  assert.equal(result.objection, null);
  assert.deepEqual(values(result), ['290020260012345', 'Y7654321G']);

  assert.match(stepText(result), /Go to the appointment on Wed, 21 Oct 2026 at 09:30/);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.match(replies[0].local, /Me han citado el 21\/10\/2026 a las 09:30\./);
  assert.match(replies[0].local, /NIE: Y7654321G/);
});

test('detects Spain automatically', () => {
  for (const id of ['tax', 'extranjeria']) {
    assert.equal(analyze(sampleText('es', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'es', id);
  }
  assert.equal(analyze(PROPUESTA, { today: TODAY, preferred: 'de' }).country.id, 'es');
});

test('proposal: alegaciones within working days, with an alegaciones letter', () => {
  const result = run(PROPUESTA);
  assert.equal(result.sender.id, 'aeat');
  assert.equal(result.kind.id, 'propuesta');
  assert.equal(result.kind.type, 'hearing');
  assert.equal(result.objection, 'alegaciones');
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.period, '10 working days');
  assert.equal(objection.iso, '2026-10-22');
  assert.match(stepText(result), /send a written objection \(alegaciones\) by Thu, 22 Oct 2026 \(estimated\)/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((item) => item.id), ['alegaciones', 'instalments', 'more-time']);
  assert.match(replies[0].local, /Asunto: Alegaciones\nNIF: X1234567L/);
  assert.match(replies[0].local, /Por medio del presente escrito formulo alegaciones en relación con su escrito de fecha 05\/10\/2026\./);
});

test('proposal that also names a later appeal still offers alegaciones, not an appeal', () => {
  const result = run(`${PROPUESTA}\nContra la liquidación que se dicte podrá interponer recurso de reposición.`);
  assert.equal(result.objection, 'recurso de reposición');
  const replies = buildReplies(result);
  assert.ok(!replies.some((item) => item.id === 'objection'));
  assert.match(replies.find((item) => item.id === 'alegaciones').local, /formulo alegaciones en relación con su escrito de fecha 05\/10\/2026/);
});

test('request for documents: working-day deadline and a cover letter', () => {
  const result = run(REQUERIMIENTO);
  assert.equal(result.sender.id, 'extranjeria');
  assert.equal(result.kind.type, 'documents');
  const deadline = result.dates.find((date) => date.type === 'deadline');
  assert.equal(deadline.iso, '2026-10-23');
  assert.deepEqual(values(result), ['080020260054321', 'Z1234567R']);
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((item) => item.id), ['send-documents', 'more-time']);
  const cover = replies.find((item) => item.id === 'send-documents');
  assert.match(cover.local, /En respuesta a su requerimiento de fecha 07\/10\/2026, adjunto la siguiente documentación:/);
});

test('traffic fine: calendar days, fine number and alegaciones', () => {
  const result = run(DGT);
  assert.equal(result.sender.id, 'dgt');
  assert.equal(result.kind.type, 'fine');
  assert.equal(result.objection, 'alegaciones');
  assert.equal(result.money.toPay.amount, 100);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.period, '20 days');
  assert.equal(objection.iso, '2026-10-29');
  assert.deepEqual(values(result), ['4602612345678']);
  assert.deepEqual(buildReplies(result).map((item) => item.id), ['alegaciones', 'instalments']);
});

test('other kinds are recognised', () => {
  const cases = [
    ['Tesorería General de la Seguridad Social\nProvidencia de apremio\nImporte total a ingresar: 720,00 €', 'tgss', 'enforcement'],
    ['Juzgado de Primera Instancia n.º 5 de Sevilla\nProcedimiento monitorio 345/2026\nPague 2.450,00 € o presente escrito de oposición en el plazo de veinte días.', 'juzgado', 'court-order'],
    ['Servicio Público de Empleo Estatal (SEPE)\nComunicación de cobro indebido de prestación por desempleo\nDebe devolver 812,40 €.', 'sepe', 'repayment'],
    ['Ayuntamiento de Valencia\nRecibo del Impuesto sobre Bienes Inmuebles (IBI) 2026\nImporte: 412,00 €', 'ayuntamiento', 'bill'],
    ['Iberdrola Clientes\nFactura de electricidad\nCUPS: ES0021000012345678AB\nTérmino de potencia: 12,30 €\nTotal a pagar: 70,22 €', 'suministros', 'utility-bill'],
    ['Burofax\nComunidad de propietarios Calle Mayor 3\nReclamación de cuotas de comunidad pendientes: 640,00 €', 'comunidad', 'reminder'],
    ['Oficina de Extranjería\nResolución denegatoria de su solicitud de autorización de residencia.', 'extranjeria', 'rejection'],
    ['Instituto Nacional de la Seguridad Social\nResolución estimatoria: se le reconoce el derecho al ingreso mínimo vital.', 'inss', 'approval'],
    ['Arrendador: Inmobiliaria Ejemplo S.L.\nLe comunicamos la no renovación del contrato de arrendamiento.', 'arrendador', 'termination'],
  ];
  for (const [text, sender, type] of cases) {
    const result = run(text);
    assert.equal(result.sender?.id, sender, text);
    assert.equal(result.kind?.type, type, text);
  }
});

test('court payment order: oposición in the steps, no ready-made court letter', () => {
  const result = run('Juzgado de Primera Instancia n.º 5 de Sevilla\nFecha: 01/10/2026\nProcedimiento monitorio 345/2026\nPague 2.450,00 € o presente escrito de oposición en el plazo de veinte días.');
  assert.equal(result.kind.type, 'court-order');
  assert.equal(result.objection, 'oposición');
  assert.match(stepText(result), /written opposition \(oposición\)/);
  assert.doesNotMatch(stepText(result), /written objection \(oposición\)/);
  assert.deepEqual(buildReplies(result).map((item) => item.id), ['instalments']);
});

test('template letters work without a letter', () => {
  const letters = templateLetters(spain, TODAY);
  assert.match(letters[0].local, /Asunto: Recurso de reposición contra su resolución de fecha \[DD\/MM\/AAAA\]/);
  for (const extra of spain.extraReplies) {
    const lines = extra.body({ country: spain, letterDate: null });
    assert.ok(lines.some((line) => line.includes('[DD/MM/AAAA]')), extra.id);
  }
});

test('reads Spanish dates and times', () => {
  assert.deepEqual(findDates('hasta el 20/11/2026', es).map((date) => date.iso), ['2026-11-20']);
  assert.deepEqual(findDates('Madrid, 15 de noviembre de 2026', es).map((date) => date.iso), ['2026-11-15']);
  const [appointment] = findDates('el 21/10/2026 a las 9:30', es);
  assert.equal(appointment.iso, '2026-10-21');
  assert.equal(appointment.time, '09:30');
});

test('reads Spanish periods', () => {
  const [month] = findPeriods('en el plazo de un mes', es);
  assert.equal(month.amount, 1);
  assert.equal(month.unit, 'month');

  const [workdays] = findPeriods('en el plazo de diez días hábiles contados desde el día siguiente a la notificación', es);
  assert.equal(workdays.amount, 10);
  assert.equal(workdays.unit, 'workday');
  assert.equal(workdays.from, 'notificación');

  const [calendar] = findPeriods('en el plazo de veinte días naturales', es);
  assert.equal(calendar.amount, 20);
  assert.equal(calendar.unit, 'day');
});

test('reads Spanish amounts', () => {
  assert.equal(findMoney('Importe: 1.234,56 €', spain).items[0].amount, 1234.56);
  assert.equal(findMoney('Importe: 1.234,56 euros', spain).items[0].amount, 1234.56);
  assert.equal(findMoney('Multa: 120 €', spain).items[0].amount, 120);
  assert.equal(findMoney('Multa: 120 €', spain).toPay.amount, 120);
});
