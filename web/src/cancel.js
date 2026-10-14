import { addDays, addMonths, addPeriod, daysBetween } from './dates.js';

export const TERMS = [0, 1, 3, 6, 12, 18, 24];

export const NOTICES = [
  { id: 'none', amount: 0, unit: 'day', label: 'No notice period' },
  { id: '7d', amount: 7, unit: 'day', label: '7 days' },
  { id: '14d', amount: 14, unit: 'day', label: '14 days' },
  { id: '30d', amount: 30, unit: 'day', label: '30 days' },
  { id: '1m', amount: 1, unit: 'month', label: '1 month' },
  { id: '2m', amount: 2, unit: 'month', label: '2 months' },
  { id: '3m', amount: 3, unit: 'month', label: '3 months' },
];

export const RENEWALS = [
  { id: 'open', label: 'Runs on, cancel any time' },
  { id: 'year', label: 'Renews for 1 year' },
  { id: 'same', label: 'Renews for the same time' },
];

export const GERMAN_RULE_START = '2022-03-01';

export function noticeById(id) {
  return NOTICES.find((notice) => notice.id === id) ?? NOTICES[0];
}

function termEnd(from, months) {
  return addDays(addMonths(from, months), -1);
}

export function lastDayToCancel(end, notice) {
  if (!notice.amount) return end;
  let day = notice.unit === 'month' ? addMonths(end, -notice.amount) : addDays(end, -notice.amount);
  while (addPeriod(addDays(day, 1), notice) <= end) day = addDays(day, 1);
  return day;
}

function renewalMonths(renewal, term) {
  return renewal === 'year' ? 12 : term;
}

export function planCancel({ start, term, notice, renewal, today }) {
  if (!term || term <= 0) {
    return { open: true, sendBy: today, ends: addPeriod(today, notice), missedEnd: null, nextEnd: null, daysLeft: 0 };
  }
  let end = termEnd(start, term);
  let missedEnd = null;
  for (let guard = 0; guard < 1000; guard += 1) {
    const sendBy = lastDayToCancel(end, notice);
    if (today <= sendBy) {
      const nextEnd = renewal === 'open' ? null : termEnd(addDays(end, 1), renewalMonths(renewal, term));
      return { open: false, sendBy, ends: end, missedEnd, nextEnd, daysLeft: daysBetween(today, sendBy) };
    }
    missedEnd ??= end;
    if (renewal === 'open') {
      return { open: true, sendBy: today, ends: addPeriod(today, notice), missedEnd, nextEnd: null, daysLeft: 0 };
    }
    end = termEnd(addDays(end, 1), renewalMonths(renewal, term));
  }
  return null;
}

export function longNotice(notice) {
  return notice.unit === 'month' ? notice.amount > 1 : notice.amount > 31;
}

export function germanRule({ countryId, start, notice, renewal }) {
  if (countryId !== 'de' || !start) return null;
  if (renewal === 'open' && !longNotice(notice)) return null;
  if (start >= GERMAN_RULE_START) return 'new';
  return renewal === 'open' ? null : 'phone';
}
