import { formatDate } from './dates.js';

const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

export function formatEuro(amount) {
  return euro.format(amount);
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
