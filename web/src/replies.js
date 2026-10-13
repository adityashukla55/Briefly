import { formatGermanDate, todayIso } from './dates.js';

function germanEuro(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function header(result, subject) {
  const lines = [
    '[Ihr Vorname Nachname]',
    '[Ihre Straße und Hausnummer]',
    '[Ihre PLZ und Ihr Ort]',
    '',
    `[${result.sender?.german ?? 'Name der Behörde oder Firma'}]`,
    '[Adresse aus dem Brief]',
    '',
    `[Ihr Ort], ${formatGermanDate(result.today ?? todayIso())}`,
    '',
    subject,
  ];
  for (const reference of result.references.slice(0, 2)) {
    lines.push(`${reference.german}: ${reference.value}`);
  }
  lines.push('', 'Sehr geehrte Damen und Herren,', '');
  return lines;
}

const CLOSING = ['', 'Mit freundlichen Grüßen', '', '', '[Unterschrift]', '[Ihr Vorname Nachname]'];

function letterDateText(result) {
  return result.letterDate ? `vom ${formatGermanDate(result.letterDate)}` : '[vom Datum des Briefes]';
}

function objection(result) {
  const term = result.objection === 'Einspruch' ? 'Einspruch' : 'Widerspruch';
  const subject = result.kind?.id === 'steuerbescheid' || term === 'Einspruch'
    ? `Einspruch gegen Ihren Bescheid ${letterDateText(result)}`
    : `Widerspruch gegen Ihren Bescheid ${letterDateText(result)}`;
  return {
    id: 'objection',
    title: `Object to the decision (${term})`,
    when: 'Use this if you think the decision is wrong. Send it before the deadline, on paper and signed. You can send the reasons later.',
    english: `I object to your decision ${result.letterDate ? `dated ${formatGermanDate(result.letterDate)}` : ''}. Reason: [your reason]. Please confirm that you received this letter.`,
    german: [
      ...header(result, subject),
      `hiermit lege ich ${term} gegen Ihren Bescheid ${letterDateText(result)} ein.`,
      '',
      'Begründung: [Erklären Sie in wenigen Sätzen, warum der Bescheid falsch ist. Wenn Sie noch Zeit brauchen, schreiben Sie: „Die Begründung reiche ich nach.“]',
      '',
      'Bitte bestätigen Sie mir den Eingang dieses Schreibens.',
      ...CLOSING,
    ].join('\n'),
  };
}

function moreTime(result) {
  const deadline = result.dates.find((date) => ['deadline', 'payment', 'objection'].includes(date.type) && date.iso);
  return {
    id: 'more-time',
    title: 'Ask for more time (Fristverlängerung)',
    when: 'Use this if you can’t make the deadline. Send it before the deadline ends.',
    english: 'You gave me a deadline. Unfortunately I can’t meet it because [reason]. Please extend it until [new date].',
    german: [
      ...header(result, 'Bitte um Fristverlängerung'),
      `in Ihrem Schreiben ${letterDateText(result)} haben Sie mir eine Frist bis zum ${deadline ? formatGermanDate(deadline.iso) : '[Datum]'} gesetzt.`,
      'Leider kann ich diese Frist nicht einhalten, weil [Grund, zum Beispiel: mir noch Unterlagen fehlen / ich krank bin].',
      '',
      'Ich bitte Sie daher, die Frist bis zum [neues Datum] zu verlängern.',
      '',
      'Vielen Dank für Ihr Verständnis.',
      ...CLOSING,
    ].join('\n'),
  };
}

function instalments(result) {
  const amount = result.money.toPay ? germanEuro(result.money.toPay.amount) : '[Betrag]';
  return {
    id: 'instalments',
    title: 'Ask to pay in parts (Ratenzahlung)',
    when: 'Use this if you can’t pay the full amount at once. Offer an amount you can really pay every month.',
    english: `You asked me to pay ${amount}. I can’t pay it all at once. I offer to pay [amount] € a month, starting on [date]. Please confirm if you agree.`,
    german: [
      ...header(result, 'Antrag auf Ratenzahlung'),
      `in Ihrem Schreiben ${letterDateText(result)} fordern Sie mich auf, ${amount} zu zahlen.`,
      'Leider kann ich den Betrag wegen meiner finanziellen Situation nicht auf einmal bezahlen.',
      '',
      'Ich biete Ihnen an, den Betrag in monatlichen Raten von [Betrag] € zu zahlen. Die erste Rate zahle ich am [Datum].',
      '',
      'Bitte teilen Sie mir mit, ob Sie damit einverstanden sind.',
      ...CLOSING,
    ].join('\n'),
  };
}

function reschedule(result) {
  const appointment = result.dates.find((date) => date.type === 'appointment' && date.iso);
  const when = appointment ? `am ${formatGermanDate(appointment.iso)}${appointment.time ? ` um ${appointment.time} Uhr` : ''}` : '[am Datum um Uhrzeit]';
  return {
    id: 'reschedule',
    title: 'Ask for a new appointment',
    when: 'Use this if you can’t come. Send it before the appointment and add proof if you can (for example a doctor’s note).',
    english: 'You invited me to an appointment. Unfortunately I can’t come because [reason]. Please give me a new appointment.',
    german: [
      ...header(result, 'Bitte um einen neuen Termin'),
      `Sie haben mich ${when} zu einem Termin eingeladen.`,
      'Leider kann ich diesen Termin nicht wahrnehmen, weil [Grund, zum Beispiel: ich krank bin / ich an diesem Tag arbeite].',
      '[Einen Nachweis lege ich bei.]',
      '',
      'Bitte geben Sie mir einen neuen Termin.',
      ...CLOSING,
    ].join('\n'),
  };
}

export function buildReplies(result) {
  const kind = result.kind?.id;
  const replies = [];
  const hasDeadline = result.dates.some((date) => ['deadline', 'payment'].includes(date.type));
  if (result.objection || ['ablehnung', 'steuerbescheid', 'rueckforderung', 'bescheid', 'festsetzung', 'bussgeldbescheid'].includes(kind)) replies.push(objection(result));
  if (result.money.toPay && result.money.toPay.amount >= 50) replies.push(instalments(result));
  if (result.dates.some((date) => date.type === 'appointment') || kind === 'einladung') replies.push(reschedule(result));
  if (hasDeadline || kind === 'unterlagen' || kind === 'anhoerung') replies.push(moreTime(result));
  return replies;
}
