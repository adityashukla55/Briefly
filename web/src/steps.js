import { formatEuro, formatWhen } from './format.js';

function firstOf(result, type) {
  return result.dates.find((date) => date.type === type) ?? null;
}

function byWhen(date, fallback = '') {
  const when = date && formatWhen(date);
  if (!when) return fallback;
  return ` by ${when}${date.estimated ? ' (estimated)' : ''}`;
}

function payStep(result) {
  const { toPay } = result.money;
  if (!toPay) return null;
  const due = firstOf(result, 'payment');
  const where = result.payment ? ` to the account ${result.payment.iban}` : '';
  return `Pay ${formatEuro(toPay.amount)}${toPay.monthly ? ' a month' : ''}${byWhen(due)}${where}.`;
}

function referenceStep(result) {
  const reference = result.payment?.reference;
  if (reference) return `Put this in the payment reference field so they know it’s from you: ${reference}`;
  return null;
}

export function buildSteps(result) {
  const steps = [];
  const kind = result.kind?.id;
  const appointment = firstOf(result, 'appointment');
  const deadline = firstOf(result, 'deadline');
  const objection = firstOf(result, 'objection');
  const add = (text, tone = 'normal') => {
    if (text && !steps.some((step) => step.text === text)) steps.push({ text, tone });
  };

  if (kind === 'vollstreckung') {
    add('Act today. Pay now, or call them today and ask for a payment plan (Ratenzahlung).', 'urgent');
    add('If you can’t pay, get free help from a debt advice centre (Schuldnerberatung) — for example at Caritas, Diakonie or your city.');
  }

  if (kind === 'mahnbescheid') {
    add('If you really owe this money, pay it.', 'urgent');
    add('If you don’t owe it, fill in the objection form (Widerspruch) that came with the letter and send it back to the court within 2 weeks.', 'urgent');
  }

  if (kind === 'bussgeldbescheid') {
    add('If you accept the fine, just pay it. If you think it’s wrong, send an objection (Einspruch) in writing within 2 weeks after you received it.');
  }

  if (['mahnung', 'festsetzung', 'rechnung', 'rueckforderung', 'nebenkosten', 'steuerbescheid', 'bussgeldbescheid', 'vollstreckung', 'bescheid'].includes(kind) || result.money.toPay) {
    if (['mahnung', 'festsetzung', 'vollstreckung'].includes(kind)) add('First check whether you already paid this. If you did, send them proof (a bank statement).');
    add(payStep(result), kind === 'mahnung' || kind === 'vollstreckung' ? 'urgent' : 'normal');
    add(referenceStep(result));
    if (result.money.toPay && result.money.toPay.amount >= 200 && kind !== 'vollstreckung') {
      add('If you can’t pay it all at once, ask for a payment plan (Ratenzahlung) before the deadline. There is a ready-made letter below.');
    }
  }

  if (result.money.toGet && result.money.toGet.role !== 'benefit' && !result.money.toPay) {
    add(`Good news: you get ${formatEuro(result.money.toGet.amount)} back. Usually you don’t need to do anything.`, 'good');
  }

  if (kind === 'bewilligung') {
    add(`Your application was approved${result.money.toGet ? `: ${formatEuro(result.money.toGet.amount)}${result.money.toGet.monthly ? ' a month' : ''}` : ''}. Check that the amounts and dates are right.`, 'good');
    add('Tell them right away if anything changes, for example your income, address or household. Otherwise you may have to pay money back later.');
  }

  if (kind === 'einladung' || appointment) {
    if (appointment?.iso) add(`Go to the appointment on ${formatWhen(appointment)}. Bring this letter and your ID.`, 'urgent');
    add('If you can’t come, tell them before the appointment and give a reason (for example a doctor’s note). There is a ready-made letter below.');
  }

  if (kind === 'anhoerung') {
    add(`You can explain your side in writing${byWhen(deadline)}. You don’t have to, but it can change their decision.`);
  }

  if (kind === 'unterlagen') {
    add(`Send the documents they ask for${byWhen(deadline)}. Keep copies of everything you send.`, 'urgent');
    add('If you need more time, ask for it before the deadline. There is a ready-made letter below.');
  } else if (deadline && kind !== 'anhoerung') {
    add(`Do what they ask${byWhen(deadline)}.`);
  }

  if (kind === 'kuendigung') {
    add('Check the end date and the notice period. If this is about your flat or your job, get advice before you sign anything — for example from a tenants’ association (Mieterverein) or a lawyer.');
  }

  if (kind === 'nebenkosten') {
    add('Check the bill carefully. You can ask to see the receipts (Belegeinsicht). You have 12 months to question it.');
  }

  if (kind === 'ablehnung') {
    add('If you think the decision is wrong, you can object. There is a ready-made letter below.');
  }

  if (objection) {
    const when = objection.iso ? ` by ${formatWhen(objection)} (estimated)` : ` within ${objection.period} after you received the letter`;
    add(`If you disagree with this decision, send a written objection (${result.objection ?? 'Widerspruch'})${when}.`);
  }

  if (!steps.length) {
    add('Read the English version below. Look for “bis zum” or “Frist” in the letter — they mark deadlines.');
  }

  const caseNumber = result.references.find((reference) => reference.german !== 'Verwendungszweck');
  if (caseNumber) add(`Write the ${caseNumber.name.toLowerCase()} (${caseNumber.german}) ${caseNumber.value} on every reply.`);
  add('Keep this letter and the envelope. The envelope can prove when it arrived.');
  return steps;
}
