import { formatDate } from './dates.js';

const formatters = new Map();

export function formatMoney(value, currency = value?.currency ?? 'EUR') {
  const amount = typeof value === 'number' ? value : value.amount;
  if (!formatters.has(currency)) formatters.set(currency, new Intl.NumberFormat('en-IE', { style: 'currency', currency }));
  return formatters.get(currency).format(amount);
}

export function formatEuro(amount) {
  return formatMoney(amount, 'EUR');
}

export function formatWhen(date) {
  if (!date.iso) return null;
  return `${formatDate(date.iso)}${date.time ? ` at ${date.time}` : ''}`;
}

export function describeDaysLeft(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return '';
  if (daysLeft < 0) return daysLeft === -1 ? 'yesterday' : `${-daysLeft} days ago`;
  if (daysLeft === 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  return `in ${daysLeft} days`;
}
