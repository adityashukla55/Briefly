import { GLOSSARY, KINDS, REFERENCE_LABELS, SENDERS } from './knowledge.js';
import { addDays, addPeriod, daysBetween, describePeriod, findDates, findPeriods, todayIso } from './dates.js';

export const DELIVERY_DAYS = 4;

const KIND_WEIGHT = { bescheid: 0.4, rechnung: 0.6 };

export function normalize(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[   ]/g, ' ')
    .replace(/[‐‑‒]/g, '-')
    .replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function globalize(pattern) {
  return new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
}

function countMatches(text, pattern) {
  return text.match(globalize(pattern))?.length ?? 0;
}

function headOf(text) {
  return text.slice(0, Math.max(500, Math.floor(text.length * 0.35)));
}

function score(text, patterns) {
  const head = headOf(text);
  return patterns.reduce((sum, pattern) => sum + countMatches(text, pattern) + 2 * countMatches(head, pattern), 0);
}

export function detectSender(text) {
  let best = null;
  for (const sender of SENDERS) {
    const points = score(text, sender.patterns);
    if (points > (best?.points ?? 0)) best = { sender, points };
  }
  if (!best) return null;
  const { id, name, german, about } = best.sender;
  return { id, name, german, about };
}

export function detectKind(text) {
  let best = null;
  for (const kind of KINDS) {
    const points = score(text, kind.patterns) * (KIND_WEIGHT[kind.id] ?? 1);
    if (points > (best?.points ?? 0)) best = { kind, points };
  }
  if (!best) return null;
  const { id, name, german, about, urgency } = best.kind;
  return { id, name, german, about, urgency };
}

function contextBefore(text, index, size = 90) {
  const slice = text.slice(Math.max(0, index - size), index);
  return slice.split(/\n\s*\n/).pop().toLowerCase();
}

function contextAfter(text, end, size = 50) {
  return text.slice(end, end + size).toLowerCase();
}

export function classifyDate(text, date) {
  const before = contextBefore(text, date.index);
  const after = contextAfter(text, date.end);
  if (/(?:vom|von)\s+[\d.\s]+\s*(?:bis|-)\s*(?:zum\s*)?$/.test(before)) return 'mention';
  if (/(?:\bvom|\bvon|\bseit|geboren am|geb\.|\bstand|\bstichtag)\s*:?\s*$/.test(before)) return 'mention';
  if (/(?:\bab dem|\bab)\s*$/.test(before)) return 'start';
  if (/(?:zahl|überweis|ueberweis|begleich|fällig|faellig|zahlungsfrist|gutgeschrieben|abgebucht|eingegangen)[^\n]{0,70}$/.test(before)
    || /^[^\n]{0,30}(?:zu zahlen|zu überweisen|zu begleichen|gutgeschrieben|eingegangen sein)/.test(after)) return 'payment';
  if (date.time || /(?:termin|einladung|erscheinen|vorsprache|vorsprechen|gespräch|laden wir|kommen sie)[^\n]{0,80}$/.test(before)) return 'appointment';
  if (/(?:bis zum|bis spätestens|bis spaetestens|spätestens|spaetestens|\bbis|frist|einreichen|vorlegen|zurücksenden|nachreichen|vorzulegen|einzureichen)\s*(?:zum|am|den|bis)?\s*:?\s*$/.test(before)) return 'deadline';
  return 'other';
}

export function findLetterDate(text, dates, today = todayIso()) {
  const limit = headOf(text).length;
  const candidates = dates.filter((date) => date.index < limit && date.type === 'other' && daysBetween(today, date.iso) <= 7);
  const labelled = candidates.find((date) => /(?:datum|den|,)\s*:?\s*$/.test(contextBefore(text, date.index, 30)) || /(?:^|\n)\s*$/.test(text.slice(Math.max(0, date.index - 2), date.index)));
  return (labelled ?? candidates[0])?.iso ?? null;
}

function periodPurpose(text, period) {
  const around = text.slice(Math.max(0, period.index - 250), period.end + 150).toLowerCase();
  if (/widerspruch|einspruch|klage|rechtsbehelf/.test(around)) return 'objection';
  if (/zahl|überweis|begleich/.test(around)) return 'payment';
  return 'deadline';
}

export function objectionTerm(text) {
  if (/einspruch/i.test(text)) return 'Einspruch';
  if (/widerspruch/i.test(text)) return 'Widerspruch';
  return null;
}

const DATE_LABELS = {
  payment: 'Pay by',
  deadline: 'Deadline',
  appointment: 'Appointment',
  start: 'Starts',
};

export function findImportantDates(text, today = todayIso()) {
  const dates = findDates(text).map((date) => ({ ...date, type: classifyDate(text, date) }));
  const letterDate = findLetterDate(text, dates, today);
  const important = [];

  for (const date of dates) {
    if (!DATE_LABELS[date.type]) continue;
    if (important.some((item) => item.iso === date.iso && item.type === date.type)) continue;
    important.push({
      type: date.type,
      label: DATE_LABELS[date.type],
      iso: date.iso,
      time: date.time ?? null,
      estimated: false,
      daysLeft: daysBetween(today, date.iso),
      source: date.raw,
    });
  }

  const term = objectionTerm(text);
  const seenPurposes = new Set();
  for (const period of findPeriods(text)) {
    const purpose = periodPurpose(text, period);
    if (seenPurposes.has(purpose)) continue;
    if (purpose !== 'objection' && important.some((item) => item.type === purpose)) continue;
    seenPurposes.add(purpose);
    const base = letterDate ? (period.from === 'datum' ? letterDate : addDays(letterDate, DELIVERY_DAYS)) : null;
    const iso = base ? addPeriod(base, period) : null;
    important.push({
      type: purpose,
      label: purpose === 'objection' ? `Last day to object${term ? ` (${term})` : ''}` : DATE_LABELS[purpose],
      iso,
      time: null,
      estimated: true,
      period: describePeriod(period),
      daysLeft: iso ? daysBetween(today, iso) : null,
      source: period.raw,
    });
  }

  important.sort((a, b) => (a.iso ?? '9999').localeCompare(b.iso ?? '9999'));
  return { letterDate, dates: important };
}

const AMOUNT = /(?:(€|EUR|Euro)\s?)?(?<![\d.,])(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}|-{1,2}))?(?!\d)(?:\s?(€|EUR\b|Euro\b))?/g;

export function parseAmount(intPart, decimals) {
  const whole = Number(intPart.replace(/\./g, ''));
  const cents = decimals && /^\d{2}$/.test(decimals) ? Number(decimals) / 100 : 0;
  return Math.round((whole + cents) * 100) / 100;
}

export function findMoney(text, kindId = null) {
  const items = [];
  for (const match of text.matchAll(AMOUNT)) {
    if (!match[1] && !match[4]) continue;
    const amount = parseAmount(match[2], match[3]);
    if (!amount) continue;
    const before = text.slice(Math.max(0, match.index - 80), match.index).toLowerCase().split('\n').slice(-2).join(' ');
    const after = contextAfter(text, match.index + match[0].length, 40);
    const around = `${before} ${after}`;
    let role = 'other';
    if (/zu erstatten|zurückzuzahlen|zurückzahlen|rückforderung|überzahl|erstattungsbetrag/.test(around) || (kindId === 'rueckforderung' && /erstatt/.test(around))) role = 'pay';
    else if (/erstattung|erstatte|guthaben|auszahl|überweisen wir|zahlen wir|erhalten sie|gutschrift|zu ihren gunsten/.test(around)) role = 'refund';
    else if (kindId === 'bewilligung' && /monatlich|pro monat|im monat|je monat|mtl\.|leistung|bürgergeld|anspruch/.test(around)) role = 'benefit';
    else if (/zahl|überweis|begleich|nachzahlung|offen|rückstand|forderung|fällig|mahngebühr|säumnis|bußgeld|bussgeld|verwarnungsgeld|gesamt|summe|betrag|beitrag|kosten|gebühr|zinsen/.test(around)) role = 'pay';
    items.push({
      amount,
      role,
      monthly: /monatlich|pro monat|im monat|je monat|mtl\./.test(around),
      total: /(?:gesamtbetrag|gesamtforderung|insgesamt|summe|zu zahlender betrag|noch zu zahlen|offener betrag|nachzahlung|gesamt)[^\n]{0,25}$/.test(before),
      source: match[0].trim(),
      index: match.index,
    });
  }
  const unique = items.filter((item, i) => items.findIndex((other) => other.amount === item.amount && other.role === item.role) === i);
  const pick = (role) => {
    const list = unique.filter((item) => item.role === role);
    return list.find((item) => item.total) ?? list.sort((a, b) => b.amount - a.amount)[0] ?? null;
  };
  return { items: unique, toPay: pick('pay'), toGet: pick('refund') ?? pick('benefit') };
}

export function isValidIban(raw) {
  const iban = raw.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  if (iban.startsWith('DE') && iban.length !== 22) return false;
  let remainder = 0;
  for (const char of iban.slice(4) + iban.slice(0, 4)) {
    const value = /[A-Z]/.test(char) ? char.charCodeAt(0) - 55 : Number(char);
    remainder = Number(`${remainder}${value}`) % 97;
  }
  return remainder === 1;
}

export function formatIban(raw) {
  return raw.replace(/\s/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
}

export function findPayment(text) {
  let iban = null;
  for (const match of text.matchAll(/\b([A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?)\b/g)) {
    const candidate = match[1];
    const variants = [candidate, candidate.replace(/[ ]?[A-Z0-9]{1,3}$/, '')];
    const valid = variants.find(isValidIban);
    if (valid) { iban = formatIban(valid); break; }
  }
  if (!iban) return null;
  const bic = text.match(/\bBIC\s*:?\s*([A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/)?.[1] ?? null;
  const recipient = text.match(/(?:zahlungsempfänger|empfänger|kontoinhaber)\s*:?\s*([^\n]{3,70})/i)?.[1].trim() ?? null;
  const reference = text.match(/(?:verwendungszweck|zahlungsreferenz|kassenzeichen)\s*:?\s*([^\n]{3,70})/i)?.[1].trim() ?? null;
  return { iban, bic, recipient, reference };
}

function takeValue(rest) {
  const cleaned = rest.replace(/^[\s:.\-–#]*(?:nr\.?|nummer)?[\s:.\-–#]*/i, '');
  const kept = [];
  for (const raw of cleaned.split(/\s+/)) {
    const token = raw.replace(/[,;]$/, '');
    if (!token) break;
    if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(token)) break;
    const looksLikeCode = /^[A-Za-zÄÖÜäöü0-9][A-Za-zÄÖÜäöü0-9/\-.]*$/.test(token) && (/\d/.test(token) || /^[A-ZÄÖÜ]{1,5}$/.test(token));
    if (!looksLikeCode) break;
    kept.push(token);
    if (raw !== token) break;
  }
  const value = kept.join(' ').replace(/[.\-/]+$/, '');
  return (value.match(/\d/g)?.length ?? 0) >= 3 ? value : null;
}

export function findReferences(text) {
  const found = [];
  for (const label of REFERENCE_LABELS) {
    for (const match of text.matchAll(label.pattern)) {
      const rest = text.slice(match.index + match[0].length, match.index + match[0].length + 70).split('\n')[0];
      const value = takeValue(rest);
      if (value && !found.some((item) => item.value === value)) {
        found.push({ name: label.name, german: label.german, value });
      }
    }
  }
  return found;
}

export function findTerms(text, limit = 14) {
  return GLOSSARY
    .map((entry) => ({ ...entry, index: text.search(entry.pattern) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index)
    .slice(0, limit)
    .map(({ term, meaning }) => ({ term, meaning }));
}

export function decideUrgency(kind, dates) {
  const upcoming = dates.filter((date) => date.iso && date.daysLeft >= 0);
  if (dates.some((date) => date.type === 'payment' && date.iso && date.daysLeft < 0)) return 'high';
  if (upcoming.some((date) => date.daysLeft <= 7 && date.type !== 'start')) return 'high';
  if (kind?.urgency) return kind.urgency;
  return upcoming.length ? 'medium' : 'low';
}

export function analyze(rawText, { today = todayIso() } = {}) {
  const text = normalize(rawText);
  const sender = detectSender(text);
  const kind = detectKind(text);
  const { letterDate, dates } = findImportantDates(text, today);
  const money = findMoney(text, kind?.id);
  const payment = findPayment(text);
  const references = findReferences(text);
  const terms = findTerms(text);
  const objection = objectionTerm(text);
  const urgency = decideUrgency(kind, dates);
  return { text, today, sender, kind, letterDate, dates, money, payment, references, terms, objection, urgency };
}
