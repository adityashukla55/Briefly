import { formatMoney, formatWhen } from './format.js';

function firstOf(result, type) {
  return result.dates.find((date) => date.type === type) ?? null;
}

function byWhen(date, country, fallback = '') {
  const when = date && formatWhen(date, country);
  if (!when) return fallback;
  return ` by ${when}${date.estimated ? ' (estimated)' : ''}`;
}

function payStep(result) {
  const { toPay } = result.money;
  if (!toPay) return null;
  const due = firstOf(result, 'payment');
  const { payment } = result;
  const where = payment?.iban ? ` to the account ${payment.iban}` : payment?.account ? ` to ${payment.account.text}` : '';
  return `Pay ${formatMoney(toPay)}${toPay.monthly ? ' a month' : ''}${byWhen(due, result.country)}${where}.`;
}

const PAYING = ['reminder', 'fee-decision', 'bill', 'repayment', 'utility-bill', 'tax-assessment', 'fine', 'enforcement', 'decision'];

export function buildSteps(result) {
  const steps = [];
  const { country } = result;
  const type = result.kind?.type;
  const appointment = firstOf(result, 'appointment');
  const deadline = firstOf(result, 'deadline');
  const objection = firstOf(result, 'objection');
  const add = (text, tone = 'normal') => {
    if (text && !steps.some((step) => step.text === text)) steps.push({ text, tone });
  };

  if (type === 'enforcement') {
    add(`Act today. Pay now, or call them today and ask for a payment plan (${country.help.instalments}).`, 'urgent');
    add(`If you can’t pay, get free help from ${country.help.debt}.`);
  }

  for (const step of result.kind?.steps ?? []) add(step, ['court-order', 'enforcement', 'fine'].includes(type) ? 'urgent' : 'normal');

  if (PAYING.includes(type) || (result.money.toPay && type !== 'hearing')) {
    if (['reminder', 'fee-decision', 'enforcement'].includes(type)) add('First check whether you already paid this. If you did, send them proof (a bank statement).');
    add(payStep(result), type === 'reminder' || type === 'enforcement' ? 'urgent' : 'normal');
    if (result.payment?.reference) add(`Put this in the payment reference field so they know it’s from you: ${result.payment.reference}`);
    if (result.money.toPay && result.money.toPay.amount >= 200 && type !== 'enforcement' && result.kind?.instalments !== false) {
      add(`If you can’t pay it all at once, ask for a payment plan (${country.help.instalments}) before the deadline. There is a ready-made letter below.`);
    }
  }

  if (result.money.toGet && result.money.toGet.role !== 'benefit' && !result.money.toPay) {
    add(`Good news: you get ${formatMoney(result.money.toGet)} back. Usually you don’t need to do anything.`, 'good');
  }

  if (type === 'approval') {
    add(`Your application was approved${result.money.toGet ? `: ${formatMoney(result.money.toGet)}${result.money.toGet.monthly ? ' a month' : ''}` : ''}. Check that the amounts and dates are right.`, 'good');
    add('Tell them right away if anything changes, for example your income, address or household. Otherwise you may have to pay money back later.');
  }

  if (type === 'appointment' || appointment) {
    if (appointment?.iso) add(`Go to the appointment on ${formatWhen(appointment, country)}`.replace(/\.?$/, '. Bring this letter and your ID.'), 'urgent');
    add('If you can’t come, tell them before the appointment and give a reason (for example a doctor’s note). There is a ready-made letter below.');
  }

  if (type === 'hearing') {
    add(`You can explain your side in writing${byWhen(deadline, country)}. You don’t have to, but it can change their decision.`);
  }

  if (type === 'documents') {
    add(`Send the documents they ask for${byWhen(deadline, country)}. Keep copies of everything you send.`, 'urgent');
    add('If you need more time, ask for it before the deadline. There is a ready-made letter below.');
  } else if (deadline && type !== 'hearing') {
    add(`Do what they ask${byWhen(deadline, country)}.`);
  }

  if (type === 'termination') {
    add(`Check the end date and the notice period. If this is about your flat or your job, get advice before you sign anything — for example from ${country.help.tenant} or a lawyer.`);
  }

  if (type === 'rejection') {
    add('If you think the decision is wrong, you can object. There is a ready-made letter below.');
  }

  if (objection && result.kind?.objection !== false) {
    const when = objection.iso ? ` by ${formatWhen(objection, country)} (estimated)` : ` within ${objection.period} after you received the letter`;
    add(`If you disagree with this decision, send a written objection (${result.objection ?? country.objectionDefault ?? country.objection[0]?.word ?? 'objection'})${when}.`);
  }

  if (!steps.length) {
    add('Read the English version below. Look for words like “deadline” and “by” — they mark what you need to do and when.');
  }

  const caseNumber = result.references.find((reference) => !reference.payment && !reference.personal) ?? result.references.find((reference) => !reference.payment);
  const sameName = caseNumber && caseNumber.name.toLowerCase().includes(caseNumber.local.toLowerCase());
  if (caseNumber) add(`Write the ${caseNumber.name.toLowerCase()}${sameName ? '' : ` (${caseNumber.local})`} ${caseNumber.value} on every reply.`);
  add('Keep this letter and the envelope. The envelope can prove when it arrived.');
  return steps;
}
