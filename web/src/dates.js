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

export function formatDate(iso, locale = 'en-GB') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(fromIso(iso));
}

export function formatShortDate(iso) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(fromIso(iso));
}

export function formatLocalDate(iso, separator = '.', order = 'dmy') {
  const [y, m, d] = iso.split('-');
  if (order === 'mdy') return `${m}${separator}${d}${separator}${y}`;
  if (order === 'ymd') return `${y}-${m}-${d}`;
  return `${d}${separator}${m}${separator}${y}`;
}

export function datePlaceholder(separator = '.', order = 'dmy') {
  if (order === 'mdy') return `[MM${separator}DD${separator}YYYY]`;
  if (order === 'ymd') return '[YYYY-MM-DD]';
  return `[DD${separator}MM${separator}YYYY]`;
}

export const formatGermanDate = (iso) => formatLocalDate(iso, '.');

const NUMERIC_DATE = /(?<![\d.\/-])(\d{1,2})\s?([./])\s?(\d{1,2})\s?\2\s?(\d{4}|\d{2})(?![\d])/g;
const DASH_DATE = /(?<![\d.\/-])(\d{1,2})-(\d{1,2})-(\d{4})(?![\d-])/g;
const ISO_DATE = /(?<![\d.\/-])(\d{4})([-\/])(\d{1,2})\2(\d{1,2})(?![\d-\/])/g;
const writtenCache = new WeakMap();

function monthNames(language) {
  return Object.keys(language.months).sort((a, b) => b.length - a.length).join('|');
}

function writtenPatterns(language) {
  if (!writtenCache.has(language)) {
    const names = monthNames(language);
    writtenCache.set(language, {
      dayFirst: new RegExp(`(?<![\\d])(\\d{1,2})(?:er|º|°|st|nd|rd|th)?\\.?\\s*(?:de\\s+)?(${names})\\.?,?\\s+(?:de\\s+|del\\s+)?(\\d{4})(?!\\d)`, 'giu'),
      monthFirst: new RegExp(`(?<![\\p{L}])(${names})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})(?!\\d)`, 'giu'),
    });
  }
  return writtenCache.get(language);
}

function toHour(hour, meridiem) {
  let value = Number(hour);
  if (meridiem) {
    const pm = /^p/i.test(meridiem);
    if (pm && value < 12) value += 12;
    if (!pm && value === 12) value = 0;
  }
  return value;
}

export function findDates(text, language, order = 'dmy') {
  const found = [];
  const add = (iso, match) => {
    if (iso && !found.some((item) => match.index < item.end && item.index < match.index + match[0].length)) {
      found.push({ iso, index: match.index, end: match.index + match[0].length, raw: match[0] });
    }
  };
  for (const match of text.matchAll(ISO_DATE)) add(toIso(Number(match[1]), Number(match[3]), Number(match[4])), match);
  const numeric = (year, first, second) => {
    const monthFirst = order === 'mdy' || (order === 'ymd' && second <= 12 && first <= 12);
    const preferred = monthFirst ? toIso(year, first, second) : toIso(year, second, first);
    return preferred ?? (monthFirst ? toIso(year, second, first) : toIso(year, first, second));
  };
  for (const match of text.matchAll(NUMERIC_DATE)) add(numeric(Number(match[4]), Number(match[1]), Number(match[3])), match);
  for (const match of text.matchAll(DASH_DATE)) add(numeric(Number(match[3]), Number(match[1]), Number(match[2])), match);
  const { dayFirst, monthFirst } = writtenPatterns(language);
  for (const match of text.matchAll(dayFirst)) add(toIso(Number(match[3]), language.months[match[2].toLowerCase()], Number(match[1])), match);
  if (language.monthFirst) {
    for (const match of text.matchAll(monthFirst)) add(toIso(Number(match[3]), language.months[match[1].toLowerCase()], Number(match[2])), match);
  }
  found.sort((a, b) => a.index - b.index);
  for (const date of found) {
    const time = text.slice(date.end, date.end + 40).match(language.time);
    if (!time) continue;
    const hour = time[1] ?? time[4];
    const minute = time[2] ?? time[5];
    const value = toHour(hour, time[3]);
    if (value < 24) date.time = `${String(value).padStart(2, '0')}:${minute ?? '00'}`;
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
  for (const match of text.matchAll(new RegExp(language.period.source.replace(/ /g, '\\s+'), language.period.flags))) {
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
