const MONTHS = {
  januar: 1, jänner: 1, jan: 1,
  februar: 2, feb: 2,
  märz: 3, maerz: 3, mär: 3, mrz: 3,
  april: 4, apr: 4,
  mai: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  dezember: 12, dez: 12,
};

const NUMBER_WORDS = {
  ein: 1, eine: 1, einer: 1, eines: 1, einem: 1, einen: 1,
  zwei: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8,
  neun: 9, zehn: 10, elf: 11, zwölf: 12, zwoelf: 12, vierzehn: 14,
  einundzwanzig: 21, dreißig: 30, dreissig: 30,
};

const NUMERIC_DATE = /(?<![\d.])(\d{1,2})\s?\.\s?(\d{1,2})\s?\.\s?(\d{4}|\d{2})(?![\d])/g;
const MONTH_NAMES = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const WRITTEN_DATE = new RegExp(`(?<![\\d])(\\d{1,2})\\.?\\s*(${MONTH_NAMES})\\.?\\s+(\\d{4})(?!\\d)`, 'giu');
const TIME_AFTER = /^[\s,]*(?:um|ab|,)?\s*(\d{1,2})(?:[:.](\d{2}))?\s*Uhr/i;

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

export function formatGermanDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function findDates(text) {
  const found = [];
  for (const match of text.matchAll(NUMERIC_DATE)) {
    const iso = toIso(Number(match[3]), Number(match[2]), Number(match[1]));
    if (iso) found.push({ iso, index: match.index, end: match.index + match[0].length, raw: match[0] });
  }
  for (const match of text.matchAll(WRITTEN_DATE)) {
    const month = MONTHS[match[2].toLowerCase()];
    const iso = toIso(Number(match[3]), month, Number(match[1]));
    if (iso) found.push({ iso, index: match.index, end: match.index + match[0].length, raw: match[0] });
  }
  found.sort((a, b) => a.index - b.index);
  for (const date of found) {
    const time = text.slice(date.end, date.end + 30).match(TIME_AFTER);
    if (time && Number(time[1]) < 24) {
      date.time = `${time[1].padStart(2, '0')}:${time[2] ?? '00'}`;
    }
  }
  return found;
}

export function parseNumberWord(word) {
  if (!word) return null;
  if (/^\d+$/.test(word)) return Number(word);
  return NUMBER_WORDS[word.toLowerCase()] ?? null;
}

const PERIOD = /(?:innerhalb|binnen)\s+(?:von\s+)?(?:(\d+|[a-zäöüß]+)\s+)?(Monats?|Monaten|Wochen?|Tagen?|Tage)\b(?:\s+(?:nach|ab|seit)\s+(?:der\s+|dem\s+|ihrer\s+|seiner\s+)?(Bekanntgabe|Zustellung|Zugang|Erhalt|Eingang|Datum))?/giu;

export function findPeriods(text) {
  const periods = [];
  for (const match of text.matchAll(PERIOD)) {
    const amount = match[1] ? parseNumberWord(match[1]) : 1;
    if (!amount) continue;
    const unitWord = match[2].toLowerCase();
    const unit = unitWord.startsWith('monat') ? 'month' : unitWord.startsWith('woche') ? 'week' : 'day';
    periods.push({
      amount,
      unit,
      from: match[3] ? match[3].toLowerCase() : null,
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
  return addDays(iso, period.amount);
}

export function describePeriod(period) {
  const unit = period.unit === 'month' ? 'month' : period.unit === 'week' ? 'week' : 'day';
  return `${period.amount} ${unit}${period.amount === 1 ? '' : 's'}`;
}
