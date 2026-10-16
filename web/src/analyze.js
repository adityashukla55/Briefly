import { countryById, detectCountry, languageOf, resolveLanguage } from './countries/index.js';
import { addDays, addPeriod, daysBetween, describePeriod, findDates, findPeriods, todayIso } from './dates.js';
import { askedPayment, findRequests } from './requests.js';
import { generalKind } from './documents.js';

export function normalize(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u2010\u2011\u2012]/g, '-')
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

function best(text, items) {
  let top = null;
  for (const item of items) {
    const points = score(text, item.patterns) * (item.weight ?? 1);
    if (points > (top?.points ?? 0)) top = { item, points };
  }
  return top?.item ?? null;
}

export function detectSender(text, country) {
  const sender = best(text, country.senders);
  if (!sender) return null;
  const { id, slug, name, local, about } = sender;
  return { id, slug, name, local, about };
}

export function detectKind(text, country) {
  const kind = best(text, country.kinds);
  if (!kind) return null;
  const { id, type, name, local, about, urgency, steps, objection, extendable, instalments } = kind;
  return { id, type, name, local, about, urgency, steps: steps ?? [], objection: objection ?? true, extendable: extendable ?? true, instalments: instalments ?? true };
}

function contextBefore(text, index, size = 90) {
  return text.slice(Math.max(0, index - size), index).split(/\n\s*\n/).pop().toLowerCase();
}

function contextAfter(text, end, size = 50) {
  return text.slice(end, end + size).toLowerCase();
}

export function classifyDate(text, date, language) {
  const { context } = language;
  const before = contextBefore(text, date.index);
  const after = contextAfter(text, date.end);
  if (context.range.test(before)) return 'mention';
  if (context.mention.test(before)) return 'mention';
  if (date.time && !context.payment.test(before)) return 'appointment';
  if (context.start.test(before)) return 'start';
  if (context.payment.test(before) || context.paymentAfter.test(after)) return 'payment';
  if (date.time || context.appointment.test(before)) return 'appointment';
  if (context.deadline.test(before)) return 'deadline';
  return 'other';
}

export function findLetterDate(text, dates, language, today = todayIso()) {
  const limit = headOf(text).length;
  const candidates = dates.filter((date) => date.index < limit && date.type === 'other' && daysBetween(today, date.iso) <= 7);
  const labelled = candidates.find((date) => language.context.letterDate.test(contextBefore(text, date.index, 40)) || /(?:^|\n)\s*$/.test(text.slice(Math.max(0, date.index - 2), date.index)));
  return (labelled ?? candidates[0])?.iso ?? null;
}

function sentenceAround(text, start, end) {
  const before = text.slice(0, start);
  const boundary = /[.!?;]\s+(?=\p{Lu})|\n\s*\n/gu;
  let from = 0;
  for (const match of before.matchAll(boundary)) from = match.index + match[0].length;
  boundary.lastIndex = 0;
  const rest = text.slice(end);
  const next = rest.search(/[.!?;]\s+(?=\p{Lu})|\n\s*\n|[.!?;]?\s*$/u);
  return text.slice(from, end + (next < 0 ? rest.length : next)).toLowerCase();
}

function periodPurpose(text, period, language) {
  if (language.context.paymentAfter.test(text.slice(period.end, period.end + 40).toLowerCase())) return 'payment';
  const sentence = sentenceAround(text, period.index, period.end);
  if (language.context.objection.test(sentence)) return 'objection';
  if (language.context.paymentNear.test(sentence)) return 'payment';
  const around = text.slice(Math.max(0, period.index - 250), period.end + 150).toLowerCase();
  if (language.context.objection.test(around)) return 'objection';
  if (language.context.paymentNear.test(around)) return 'payment';
  return 'deadline';
}

export function objectionTerm(text, country) {
  return country.objection.find((entry) => entry.pattern.test(text))?.word ?? null;
}

const DATE_LABELS = {
  payment: 'Pay by',
  deadline: 'Deadline',
  appointment: 'Appointment',
  start: 'Starts',
};

const FROM_LETTER_DATE = /^(?:datum|ausfertigung|dagtekening|verzending|verzenddatum|date|fecha|data)$/;
const FROM_PAYMENT_END = /^termo$/;

export function findImportantDates(text, country, today = todayIso()) {
  const language = languageOf(country);
  const dates = findDates(text, language, country.dateOrder ?? 'dmy').map((date) => ({ ...date, type: classifyDate(text, date, language) }));
  const letterDate = findLetterDate(text, dates, language, today);
  const important = [];

  for (const date of dates) {
    if (!DATE_LABELS[date.type]) continue;
    if (date.type === 'appointment' && letterDate && date.iso < letterDate) continue;
    if (important.some((item) => item.iso === date.iso && item.type === date.type)) continue;
    important.push({
      type: date.type,
      label: DATE_LABELS[date.type],
      iso: date.iso,
      time: date.time ?? null,
      estimated: false,
      daysLeft: daysBetween(today, date.iso),
      source: date.raw,
      index: date.index,
    });
  }

  const term = objectionTerm(text, country) ?? country.objectionDefault ?? null;
  const seenPurposes = new Set();
  for (const period of findPeriods(text, language)) {
    const purpose = periodPurpose(text, period, language);
    if (seenPurposes.has(purpose)) continue;
    if (purpose !== 'objection' && important.some((item) => item.type === purpose)) continue;
    seenPurposes.add(purpose);
    const paymentEnd = FROM_PAYMENT_END.test(period.from ?? '') ? important.find((item) => item.type === 'payment' && item.iso)?.iso : null;
    const base = paymentEnd ?? (letterDate ? (FROM_LETTER_DATE.test(period.from ?? '') ? letterDate : addDays(letterDate, country.deliveryDays)) : null);
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
      index: period.index,
    });
  }

  important.sort((a, b) => (a.iso ?? '9999').localeCompare(b.iso ?? '9999'));
  return { letterDate, dates: important };
}

const CURRENCY = {
  EUR: { words: '€|EUR\\b|Euros?\\b', symbol: '€' },
  CHF: { words: 'CHF|SFr\\.?|Fr\\.|Franken\\b', symbol: 'CHF' },
  PLN: { words: 'zł|PLN\\b|złotych\\b|złote\\b|zl\\b', symbol: 'PLN' },
  USD: { words: 'US\\$|\\$|USD\\b|dollars?\\b', symbol: '$' },
  CAD: { words: 'CA\\$|C\\$|\\$|CAD\\b|dollars?\\b', symbol: '$' },
  GBP: { words: '£|GBP\\b|pounds?(?: sterling)?\\b', symbol: '£' },
  SEK: { words: 'kr\\.?(?![a-zåäö])|kronor\\b|SEK\\b', symbol: 'kr' },
  DKK: { words: 'kr\\.?(?![a-zæøå])|kroner\\b|DKK\\b', symbol: 'kr.' },
};

const amountCache = new Map();

export function amountPattern(country) {
  const key = `${country.currency}${country.decimal}${country.thousands ?? ''}`;
  if (!amountCache.has(key)) {
    const currency = CURRENCY[country.currency].words;
    const thousands = country.thousands ?? (country.decimal === ',' ? '.' : '\'’');
    const group = `[${thousands.replace(/[\]\\^-]/g, '\\$&')}]`;
    const decimal = country.decimal === ',' ? ',' : '\\.';
    amountCache.set(key, new RegExp(`(?:(${currency})[^\\S\\n]?)?(?<![\\d.,'’])(\\d{1,3}(?:${group}\\d{3})+|\\d+)(?:${decimal}(\\d{2}|-{1,2}|–))?(?!\\d)(?:[^\\S\\n]?(${currency})(?![^\\S\\n]?\\d))?`, 'gi'));
  }
  return amountCache.get(key);
}

export function parseAmount(intPart, decimals) {
  const whole = Number(intPart.replace(/\D/g, ''));
  const cents = decimals && /^\d{2}$/.test(decimals) ? Number(decimals) / 100 : 0;
  return Math.round((whole + cents) * 100) / 100;
}

export function findMoney(text, country, kind = null) {
  const { money } = languageOf(country);
  const items = [];
  for (const match of text.matchAll(amountPattern(country))) {
    if (!match[1] && !match[4]) continue;
    const amount = parseAmount(match[2], match[3]);
    if (!amount) continue;
    const before = text.slice(Math.max(0, match.index - 80), match.index).toLowerCase().split('\n').slice(-2).join(' ');
    const after = contextAfter(text, match.index + match[0].length, 40);
    const around = `${before} ${after}`;
    let role = 'other';
    if (money.repay.test(around) || (kind?.type === 'repayment' && money.repayKind.test(around))) role = 'pay';
    else if (money.refund.test(around)) role = 'refund';
    else if (kind?.type === 'approval' && money.benefit.test(around)) role = 'benefit';
    else if (money.pay.test(around)) role = 'pay';
    items.push({
      amount,
      currency: country.currency,
      role,
      monthly: money.monthly.test(around),
      total: money.total.test(before),
      source: match[0].trim(),
      index: match.index,
    });
  }
  const unique = items.filter((item, i) => items.findIndex((other) => other.amount === item.amount && other.role === item.role) === i)
    .map((item) => ({ ...item, total: items.some((other) => other.amount === item.amount && other.role === item.role && other.total) }));
  const pick = (role) => {
    const list = unique.filter((item) => item.role === role);
    return list.find((item) => item.total) ?? list.sort((a, b) => b.amount - a.amount)[0] ?? null;
  };
  return { items: unique, all: items, toPay: pick('pay'), toGet: pick('refund') ?? pick('benefit') };
}

export function isValidIban(raw, lengths = { DE: 22, AT: 20, CH: 21, FR: 27, ES: 24, IT: 27, LI: 21, NL: 18, PL: 28, BE: 16, GB: 22, IE: 22, PT: 25, SE: 24, DK: 18 }) {
  const iban = raw.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const expected = lengths[iban.slice(0, 2)];
  if (expected && iban.length !== expected) return false;
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

export function findPayment(text, country) {
  const language = languageOf(country);
  let iban = null;
  for (const match of text.matchAll(/\b([A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?)\b/g)) {
    const candidate = match[1];
    const variants = [candidate, candidate.replace(/[ ]?[A-Z0-9]{1,3}$/, ''), candidate.replace(/[ ]?[A-Z0-9]{4}$/, '')];
    const valid = variants.find((variant) => isValidIban(variant));
    if (valid) { iban = formatIban(valid); break; }
  }
  if (!iban && country.domesticIban) {
    for (const match of text.matchAll(/(?<!\d[ ]?)(\d{2}(?:[ ]?\d{4}){6})(?![ ]?\d)/g)) {
      const candidate = `${country.domesticIban}${match[1].replace(/\s/g, '')}`;
      if (isValidIban(candidate)) { iban = formatIban(candidate); break; }
    }
  }
  const account = iban ? null : country.localAccount?.(text) ?? null;
  if (!iban && !account) return null;
  const bic = text.match(/\b(?:BIC|SWIFT)(?:\/SWIFT)?\s*:?\s*([A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/)?.[1] ?? null;
  const recipient = text.match(language.payment.recipient)?.[1].trim() ?? null;
  const reference = (country.paymentReference ? text.match(country.paymentReference)?.[1].replace(/\s+/g, '') : text.match(language.payment.reference)?.[1].trim()) ?? null;
  return { iban, account, bic, recipient, reference };
}

function takeValue(rest) {
  const cleaned = rest.replace(/^[\s:.\-–#°]*(?:nr\.?|nummer|no\.?|n[°º.]\.?|núm\.?|num\.?)?[\s:.\-–#°]*/i, '');
  const kept = [];
  const tokens = cleaned.split(/\s+/);
  const isDate = (token) => /^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(token);
  for (const [i, raw] of tokens.entries()) {
    const token = raw.replace(/[,;]$/, '');
    if (!token) break;
    if (isDate(token)) break;
    const looksLikeCode = /^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9/\-.]*$/.test(token) && (/\d/.test(token) || /^[A-ZÄÖÜ]{1,5}$/.test(token));
    const next = tokens[i + 1] ?? '';
    const shortPrefix = raw === token && /^[A-Z][a-z]{0,2}(?:-[a-z])?$/.test(token) && /\d/.test(next) && !isDate(next.replace(/[,;.]$/, ''));
    if (!looksLikeCode && !shortPrefix) break;
    kept.push(token);
    if (raw !== token) break;
  }
  const value = kept.join(' ').replace(/[.\-/]+$/, '');
  const digits = value.match(/\d/g)?.length ?? 0;
  return digits >= 3 || (digits >= 2 && /[A-Za-z]/.test(value) && value.length >= 3) ? value : null;
}

export function findReferences(text, country) {
  const found = [];
  for (const label of country.references) {
    for (const match of text.matchAll(globalize(label.pattern))) {
      const window = text.slice(match.index + match[0].length, match.index + match[0].length + 140);
      const lines = window.split('\n');
      const value = label.value
        ? window.match(label.value)?.[0].replace(/\s+/g, '') ?? null
        : takeValue(lines[0]) ?? (/^[\s:.\-–#°]*$/.test(lines[0]) && lines[1] ? takeValue(lines[1]) : null);
      if (value && !found.some((item) => item.value === value)) {
        found.push({ name: label.name, local: label.local, value, payment: Boolean(label.payment), personal: Boolean(label.personal) });
      }
    }
  }
  return found;
}

export function findTerms(text, country, limit = 14) {
  return country.glossary
    .map((entry) => ({ ...entry, index: text.search(entry.pattern) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index)
    .slice(0, limit)
    .map(({ term, meaning, slug }) => ({ term, meaning, slug }));
}

export function decideUrgency(kind, dates) {
  const upcoming = dates.filter((date) => date.iso && date.daysLeft >= 0);
  if (dates.some((date) => date.type === 'payment' && date.iso && date.daysLeft < 0)) return 'high';
  if (upcoming.some((date) => date.daysLeft <= 7 && date.type !== 'start')) return 'high';
  if (kind?.urgency) return kind.urgency;
  return upcoming.length ? 'medium' : 'low';
}

export function detectCountryId(rawText, preferred = null) {
  return detectCountry(normalize(rawText), preferred).id;
}

const DEMANDS = ['reminder', 'fine', 'enforcement', 'repayment', 'court-order', 'fee-decision', 'bill', 'utility-bill'];

export function analyze(rawText, { today = todayIso(), country: countryId = null, preferred = 'de' } = {}) {
  const text = normalize(rawText);
  const country = resolveLanguage(countryId ? countryById(countryId) : detectCountry(text, preferred), text);
  const sender = detectSender(text, country);
  const kind = generalKind(text) ?? detectKind(text, country);
  const { letterDate, dates: found } = findImportantDates(text, country, today);
  const { requests, nothing } = findRequests(text, languageOf(country));
  const money = findMoney(text, country, kind);
  const asked = askedPayment(requests, money.all, text);
  const asks = languageOf(country).asks;
  const automatic = nothing || Boolean(asks?.debit.test(text));
  const demand = DEMANDS.includes(kind?.type) || requests.some((request) => request.due && asks.pay.test(request.text));
  const fallback = !asked && !automatic && demand ? money.toPay : null;
  money.toPay = asked ? { ...asked.item, role: 'pay', asked: asked.request.text } : fallback ? { ...fallback, asked: null } : null;
  if (money.toGet && money.toPay && money.toGet.amount === money.toPay.amount) money.toGet = null;
  const pleading = requests.filter((request) => request.ask);
  const asking = (pleading.length ? pleading : requests.filter((request) => request.owed)).slice(0, 4).map((request) => request.text);
  const dates = requests.length || money.toPay ? found : found.filter((date) => date.estimated || !['deadline', 'payment'].includes(date.type));
  const quiet = nothing && !money.toPay && !dates.some((date) => ['deadline', 'payment', 'appointment'].includes(date.type) && !date.estimated);
  const payment = findPayment(text, country);
  const references = findReferences(text, country);
  const terms = findTerms(text, country);
  const objection = objectionTerm(text, country);
  const urgency = quiet || (!asking.length && !money.toPay && !dates.length) ? 'low' : decideUrgency(kind, dates);
  return { text, today, country, sender, kind, letterDate, dates, money, asks: asking, nothing: quiet, payment, references, terms, objection, urgency };
}
