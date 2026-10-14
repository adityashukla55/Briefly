import { formatDate } from './dates.js';

const formatters = new Map();
const MONEY_LOCALE = { USD: 'en-US', CAD: 'en-CA' };
const DATE_LOCALE = { us: 'en-US', ca: 'en-CA' };
const TWELVE_HOUR = new Set(['us', 'ca']);

export function formatMoney(value, currency = value?.currency ?? 'EUR') {
  const amount = typeof value === 'number' ? value : value.amount;
  if (!formatters.has(currency)) formatters.set(currency, new Intl.NumberFormat(MONEY_LOCALE[currency] ?? 'en-IE', { style: 'currency', currency }));
  return formatters.get(currency).format(amount);
}

function clock(time, country) {
  if (!TWELVE_HOUR.has(country?.id)) return time;
  const [hours, minutes] = time.split(':').map(Number);
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'p.m.' : 'a.m.'}`;
}

export function formatEuro(amount) {
  return formatMoney(amount, 'EUR');
}

export function formatWhen(date, country = null) {
  if (!date.iso) return null;
  return `${formatDate(date.iso, DATE_LOCALE[country?.id] ?? 'en-GB')}${date.time ? ` at ${clock(date.time, country)}` : ''}`;
}

export function describeDaysLeft(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return '';
  if (daysLeft < 0) return daysLeft === -1 ? 'yesterday' : `${-daysLeft} days ago`;
  if (daysLeft === 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  return `in ${daysLeft} days`;
}
