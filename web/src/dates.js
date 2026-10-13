export function toIso(year, month, day) {
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 1990 || year > 2099) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return null;
  return date.toISOString().slice(0, 10);
}

export function fromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function todayIso(now = new Date()) {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(iso, days) {
  const date = fromIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addWorkdays(iso, days) {
  let date = iso;
  let left = days;
  while (left > 0) {
    date = addDays(date, 1);
    if (![0, 6].includes(fromIso(date).getUTCDay())) left -= 1;
  }
  return date;
}

export function addMonths(iso, months) {
  const date = fromIso(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromIsoDate, toIsoDate) {
  return Math.round((fromIso(toIsoDate) - fromIso(fromIsoDate)) / 86400000);
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(fromIso(iso));
}

export function formatShortDate(iso) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(fromIso(iso));
}

export function formatLocalDate(iso, separator = '.') {
  const [y, m, d] = iso.split('-');
  return `${d}${separator}${m}${separator}${y}`;
}

export const formatGermanDate = (iso) => formatLocalDate(iso, '.');

const NUMERIC_DATE = /(?<![\d.\/])(\d{1,2})\s?([./])\s?(\d{1,2})\s?\2\s?(\d{4}|\d{2})(?![\d])/g;
const writtenCache = new WeakMap();

function writtenPattern(language) {
  if (!writtenCache.has(language)) {
    const names = Object.keys(language.months).sort((a, b) => b.length - a.length).join('|');
    writtenCache.set(language, new RegExp(`(?<![\\d])(\\d{1,2})(?:er|º|°)?\\.?\\s*(?:de\\s+)?(${names})\\.?\\s+(?:de\\s+|del\\s+)?(\\d{4})(?!\\d)`, 'giu'));
  }
  return writtenCache.get(language);
}

export function findDates(text, language) {
  const found = [];
  for (const match of text.matchAll(NUMERIC_DATE)) {
    const iso = toIso(Number(match[4]), Number(match[3]), Number(match[1]));
    if (iso) found.push({ iso, index: match.index, end: match.index + match[0].length, raw: match[0] });
  }
  for (const match of text.matchAll(writtenPattern(language))) {
    const month = language.months[match[2].toLowerCase()];
    const iso = toIso(Number(match[3]), month, Number(match[1]));
    if (iso) found.push({ iso, index: match.index, end: match.index + match[0].length, raw: match[0] });
  }
  found.sort((a, b) => a.index - b.index);
  for (const date of found) {
    const time = text.slice(date.end, date.end + 40).match(language.time);
    if (time && Number(time[1]) < 24) {
      date.time = `${time[1].padStart(2, '0')}:${time[2] ?? '00'}`;
    }
  }
  return found;
}

export function parseNumberWord(word, language) {
  if (!word) return null;
  if (/^\d+$/.test(word)) return Number(word);
  return language.numberWords[word.toLowerCase()] ?? null;
}

function unitOf(word, qualifier, language) {
  const lower = word.toLowerCase();
  if (language.units.month.test(lower)) return 'month';
  if (language.units.week.test(lower)) return 'week';
  if (language.units.workday.test(lower) || (qualifier && language.units.workday.test(qualifier.toLowerCase()))) return 'workday';
  if (qualifier && language.units.calendar?.test(qualifier.toLowerCase())) return 'day';
  return language.units.defaultDay ?? 'day';
}

export function findPeriods(text, language) {
  const periods = [];
  for (const match of text.matchAll(new RegExp(language.period.source, language.period.flags))) {
    const { amount: amountWord, unit: unitWord, qualifier, from } = match.groups;
    const amount = amountWord ? parseNumberWord(amountWord, language) : 1;
    if (!amount) continue;
    periods.push({
      amount,
      unit: unitOf(unitWord, qualifier, language),
      from: from ? from.toLowerCase() : null,
      index: match.index,
      end: match.index + match[0].length,
      raw: match[0],
    });
  }
  return periods;
}

export function addPeriod(iso, period) {
  if (period.unit === 'month') return addMonths(iso, period.amount);
  if (period.unit === 'week') return addDays(iso, period.amount * 7);
  if (period.unit === 'workday') return addWorkdays(iso, period.amount);
  return addDays(iso, period.amount);
}

export function describePeriod(period) {
  const unit = { month: 'month', week: 'week', workday: 'working day', day: 'day' }[period.unit];
  return `${period.amount} ${unit}${period.amount === 1 ? '' : 's'}`;
}
