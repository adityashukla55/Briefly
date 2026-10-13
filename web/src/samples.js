import { addDays, addMonths, formatGermanDate, fromIso, todayIso } from './dates.js';

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function quarterBefore(iso) {
  const [year, month] = iso.split('-').map(Number);
  const startMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const start = addMonths(`${year}-${String(startMonth).padStart(2, '0')}-01`, -3);
  const end = addDays(addMonths(start, 3), -1);
  return { start, end };
}

function taxLetter(today) {
  const letter = addDays(today, -3);
  const year = Number(today.slice(0, 4)) - 1;
  const due = nextWorkday(addDays(letter, 32));
  return `Finanzamt Chemnitz-Mitte
Postfach 12 34 · 09001 Chemnitz

Herrn
Max Beispiel
Musterstraße 12
09111 Chemnitz

Steuernummer: 214/123/45678
Datum: ${formatGermanDate(letter)}

Bescheid für ${year}
über Einkommensteuer

Sehr geehrter Herr Beispiel,

die Einkommensteuer für das Jahr ${year} wird auf 4.812,00 € festgesetzt. Die bereits gezahlte Lohnsteuer wird angerechnet.

Abrechnung
Festgesetzte Einkommensteuer: 4.812,00 €
Abzüglich Lohnsteuer: 4.400,00 €
Nachzahlung: 412,00 €

Bitte zahlen Sie den Betrag von 412,00 € bis zum ${formatGermanDate(due)} auf folgendes Konto:
Empfänger: Finanzamt Chemnitz-Mitte
IBAN: DE89 3704 0044 0532 0130 00
BIC: COBADEFFXXX
Verwendungszweck: 214/123/45678 ESt ${year}

Bei Zahlung nach Ablauf des Fälligkeitstages entstehen Säumniszuschläge.

Rechtsbehelfsbelehrung
Gegen diesen Bescheid ist der Einspruch gegeben. Der Einspruch ist innerhalb eines Monats nach Bekanntgabe dieses Bescheides beim Finanzamt Chemnitz-Mitte schriftlich oder elektronisch einzulegen.

Mit freundlichen Grüßen
Ihr Finanzamt Chemnitz-Mitte`;
}

function jobcenterLetter(today) {
  const letter = addDays(today, -2);
  const appointment = nextWorkday(addDays(today, 8));
  return `Jobcenter Leipzig
Georg-Schumann-Straße 150 · 04159 Leipzig

Frau
Erika Muster
Beispielweg 3
04109 Leipzig

BG-Nummer: 05301//0012345
Kundennummer: 123D456789
Datum: ${formatGermanDate(letter)}

Einladung zum Meldetermin

Sehr geehrte Frau Muster,

bitte kommen Sie am ${formatGermanDate(appointment)} um 09:30 Uhr in das Jobcenter Leipzig, Raum 2.14.

Ich möchte mit Ihnen über Ihre aktuelle berufliche Situation sprechen.

Bitte bringen Sie folgende Unterlagen mit:
- diese Einladung
- Ihren Personalausweis oder Reisepass
- Ihren aktuellen Lebenslauf

Wenn Sie ohne wichtigen Grund nicht zu diesem Termin erscheinen, kann Ihr Bürgergeld um 10 Prozent gemindert werden (Leistungsminderung).

Wenn Sie den Termin nicht wahrnehmen können, teilen Sie mir dies bitte vorher mit.

Mit freundlichen Grüßen
Im Auftrag
J. Schneider`;
}

function feeLetter(today) {
  const letter = addDays(today, -4);
  const due = nextWorkday(addDays(today, 10));
  const { start, end } = quarterBefore(today);
  return `ARD ZDF Deutschlandradio
Beitragsservice
50656 Köln

Herrn
Ali Beispiel
Lindenallee 7
01067 Dresden

Beitragsnummer: 123 456 789
Datum: ${formatGermanDate(letter)}

Zahlungserinnerung

Sehr geehrter Herr Beispiel,

auf Ihrem Beitragskonto ist ein Rückstand entstanden. Für den Zeitraum vom ${formatGermanDate(start)} bis ${formatGermanDate(end)} haben wir noch keine Zahlung erhalten.

Offener Betrag: 55,08 €

Bitte überweisen Sie den offenen Betrag bis zum ${formatGermanDate(due)} auf folgendes Konto:
Empfänger: ARD ZDF Deutschlandradio Beitragsservice
IBAN: DE89 3704 0044 0532 0130 00
Verwendungszweck: Beitragsnummer 123 456 789

Wenn Sie bereits gezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.

Erfolgt keine Zahlung, müssen wir einen Festsetzungsbescheid erlassen. Dabei entsteht ein Säumniszuschlag von mindestens 8,00 €.

Mit freundlichen Grüßen
Ihr Beitragsservice`;
}

export const SAMPLES = [
  { id: 'tax', title: 'Tax office', subtitle: 'Tax bill with a deadline', build: taxLetter },
  { id: 'jobcenter', title: 'Jobcenter', subtitle: 'Appointment invitation', build: jobcenterLetter },
  { id: 'fee', title: 'TV and radio fee', subtitle: 'Payment reminder', build: feeLetter },
];

export function sampleText(id, today = todayIso()) {
  return SAMPLES.find((sample) => sample.id === id)?.build(today) ?? '';
}
