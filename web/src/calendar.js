function escapeText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

function fold(line) {
  const parts = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  parts.push(rest);
  return parts.join('\r\n');
}

function compact(iso) {
  return iso.replace(/-/g, '');
}

function nextDay(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function makeIcs({ title, iso, time = null, description = '', now = new Date() }) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = `${compact(iso)}-${Math.random().toString(36).slice(2, 10)}@briefly`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Briefly//German letters explained//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
  ];
  if (time) {
    const [hours, minutes] = time.split(':');
    const start = `${compact(iso)}T${hours.padStart(2, '0')}${minutes}00`;
    const endHour = String(Math.min(Number(hours) + 1, 23)).padStart(2, '0');
    lines.push(`DTSTART:${start}`, `DTEND:${compact(iso)}T${endHour}${minutes}00`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compact(iso)}`, `DTEND;VALUE=DATE:${compact(nextDay(iso))}`);
  }
  lines.push(
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    `TRIGGER:${time ? '-PT2H' : '-P2D'}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
