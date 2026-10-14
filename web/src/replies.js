import { languageOf } from './countries/index.js';
import { datePlaceholder, formatLocalDate, todayIso } from './dates.js';

function local(country, iso) {
  return formatLocalDate(iso, country.dateSeparator ?? '.', country.dateOrder ?? 'dmy');
}

function templatesFor(country) {
  const base = languageOf(country).replies;
  return { ...base, ...(country.replies ?? {}) };
}

function localMoney(money, country) {
  const locale = country.locale ?? { de: 'de-DE', at: 'de-AT', ch: 'de-CH', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', nl: 'nl-NL', pl: 'pl-PL', us: 'en-US', ca: 'en-CA' }[country.id] ?? 'de-DE';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency ?? country.currency }).format(money.amount);
}

function header(result, templates, subject) {
  const { you } = templates;
  const lines = [
    you.name,
    you.street,
    you.city,
    '',
    `[${result.sender?.local ?? templates.officeFallback}]`,
    templates.officeAddress,
    '',
    `${you.place}, ${result.today === null ? datePlaceholder(result.country.dateSeparator ?? '.', result.country.dateOrder ?? 'dmy') : local(result.country, result.today ?? todayIso())}`,
    '',
    subject,
  ];
  for (const reference of [...result.references].sort((a, b) => Number(a.personal) - Number(b.personal)).slice(0, 2)) {
    lines.push(`${reference.local}: ${reference.value}`);
  }
  lines.push('', templates.greeting, '');
  return lines;
}

function compose(result, templates, subject, body) {
  return [...header(result, templates, subject), ...body, '', ...templates.closing].join('\n');
}

function letterOf(result, templates) {
  return templates.letterOf(result.letterDate ? local(result.country, result.letterDate) : null);
}

function objection(result, templates) {
  const term = result.objection ?? result.country.objectionDefault ?? result.country.objection[0].word;
  const of = letterOf(result, templates);
  return {
    id: 'objection',
    title: `Object to the decision (${term})`,
    when: result.country.objectionAdvice ?? 'Use this if you think the decision is wrong. Send it before the deadline, signed, and keep a copy.',
    english: `I object to your decision${result.letterDate ? ` dated ${local(result.country, result.letterDate)}` : ''}. Reason: [your reason]. Please confirm that you received this letter.`,
    local: compose(result, templates, templates.objection.subject(term, of), templates.objection.body(term, of)),
  };
}

function moreTime(result, templates) {
  const deadline = result.dates.find((date) => ['deadline', 'payment'].includes(date.type) && date.iso);
  return {
    id: 'more-time',
    title: `Ask for more time (${templates.moreTime.name ?? templates.moreTime.subject})`,
    when: 'Use this if you can’t make the deadline. Send it before the deadline ends.',
    english: 'You gave me a deadline. Unfortunately I can’t meet it because [reason]. Please extend it until [new date].',
    local: compose(result, templates, templates.moreTime.subject, templates.moreTime.body(letterOf(result, templates), deadline ? local(result.country, deadline.iso) : null)),
  };
}

function instalments(result, templates) {
  const amount = result.money.toPay ? localMoney(result.money.toPay, result.country) : null;
  return {
    id: 'instalments',
    title: `Ask to pay in parts (${result.country.help.instalments})`,
    when: 'Use this if you can’t pay the full amount at once. Offer an amount you can really pay every month.',
    english: `You asked me to pay ${amount ?? '[amount]'}. I can’t pay it all at once. I offer to pay [amount] a month, starting on [date]. Please confirm if you agree.`,
    local: compose(result, templates, templates.instalments.subject, templates.instalments.body(letterOf(result, templates), amount)),
  };
}

function reschedule(result, templates) {
  const appointment = result.dates.find((date) => date.type === 'appointment' && date.iso);
  const when = appointment ? templates.appointmentWhen(local(result.country, appointment.iso), appointment.time) : null;
  return {
    id: 'reschedule',
    title: 'Ask for a new appointment',
    when: 'Use this if you can’t come. Send it before the appointment and add proof if you can (for example a doctor’s note).',
    english: 'You invited me to an appointment. Unfortunately I can’t come because [reason]. Please give me a new appointment.',
    local: compose(result, templates, templates.reschedule.subject, templates.reschedule.body(when)),
  };
}

export function buildReplies(result) {
  const templates = templatesFor(result.country);
  const type = result.kind?.type;
  const replies = [];
  const hasDeadline = result.dates.some((date) => ['deadline', 'payment'].includes(date.type));
  const extras = (result.country.extraReplies ?? []).filter((extra) => extra.when(result));
  const replaced = new Set(extras.map((extra) => extra.replaces).filter(Boolean));
  const canObject = result.kind?.objection !== false && !replaced.has('objection');
  if (canObject && (result.objection || ['rejection', 'tax-assessment', 'repayment', 'decision', 'fee-decision', 'fine'].includes(type))) replies.push(objection(result, templates));
  for (const extra of extras) {
    replies.push({ id: extra.id, title: extra.title, when: extra.advice, english: extra.english, local: compose(result, templates, extra.subject, extra.body(result)) });
  }
  if (result.money.toPay && result.money.toPay.amount >= 50 && result.kind?.instalments !== false) replies.push(instalments(result, templates));
  if (result.dates.some((date) => date.type === 'appointment') || type === 'appointment') replies.push(reschedule(result, templates));
  if ((hasDeadline || type === 'documents' || type === 'hearing') && type !== 'court-order' && result.kind?.extendable !== false) replies.push(moreTime(result, templates));
  return replies;
}

export function templateLetters(country) {
  const templates = templatesFor(country);
  const result = {
    country,
    today: null,
    sender: null,
    kind: null,
    letterDate: null,
    dates: [],
    money: { toPay: null },
    references: [],
    objection: country.objectionDefault ?? country.objection[0].word,
  };
  return [
    objection(result, templates),
    moreTime(result, templates),
    { ...instalments(result, templates) },
    reschedule(result, templates),
  ];
}
