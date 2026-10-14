import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, findMoney, isValidIban } from '../web/src/analyze.js';
import { countryById, sampleText } from '../web/src/countries/index.js';
import { daysBetween, findDates, findPeriods } from '../web/src/dates.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { buildReplies, templateLetters } from '../web/src/replies.js';
import { buildSteps } from '../web/src/steps.js';

const TODAY = '2026-10-13';
const pl = LANGUAGES.pl;
const poland = countryById('pl');
const TYPES = ['enforcement', 'court-order', 'repayment', 'fine', 'reminder', 'fee-decision', 'hearing', 'appointment', 'documents', 'rejection', 'tax-assessment', 'approval', 'termination', 'utility-bill', 'bill', 'decision'];

const run = (text) => analyze(text, { today: TODAY, country: 'pl' });
const sample = (id, today = TODAY) => analyze(sampleText('pl', id, today), { today, country: 'pl' });
const stepText = (result) => buildSteps(result).map((step) => step.text).join(' ');
const values = (result) => result.references.map((reference) => reference.value);

test('pack has the expected shape', () => {
  assert.equal(poland.id, 'pl');
  assert.equal(poland.slug, 'poland');
  assert.equal(poland.language, 'pl');
  assert.equal(poland.currency, 'PLN');
  assert.ok(poland.intro.length > 40);
  assert.ok(poland.deliveryNote.length > 40);
  assert.equal(poland.deadlineWords.length, 3);
  assert.ok(poland.senders.length >= 13 && poland.senders.length <= 16);
  assert.ok(poland.kinds.length >= 12 && poland.kinds.length <= 16);
  assert.ok(poland.references.length >= 8 && poland.references.length <= 12);
  assert.ok(poland.glossary.length >= 35 && poland.glossary.length <= 50);
  assert.equal(poland.samples.length, 2);
  for (const kind of poland.kinds) assert.ok(TYPES.includes(kind.type), kind.id);
  for (const list of [poland.senders, poland.kinds, poland.glossary]) {
    const ids = list.map((item) => item.id ?? item.slug);
    assert.equal(new Set(ids).size, ids.length);
  }
  for (const item of [...poland.senders, ...poland.glossary]) assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(new Set(poland.glossary.map((entry) => entry.term)).size, poland.glossary.length);
  const stateless = [...poland.signals, ...poland.objection.map((entry) => entry.pattern), ...poland.glossary.map((entry) => entry.pattern), ...[...poland.senders, ...poland.kinds].flatMap((item) => item.patterns)];
  for (const pattern of stateless) assert.ok(!pattern.global, String(pattern));
  assert.ok(poland.references.some((reference) => reference.local === 'Tytułem' && reference.payment));
  assert.ok(poland.references.some((reference) => reference.local === 'PESEL' && reference.personal));
  for (const sender of poland.senders) {
    assert.ok(sender.letters.length >= 2 && sender.letters.length <= 4, sender.id);
    assert.ok(sender.tips.length >= 1 && sender.tips.length <= 2, sender.id);
  }
  const english = [poland.intro, poland.deliveryNote, poland.objectionAdvice, ...poland.senders.flatMap((sender) => [sender.name, sender.about, ...sender.tips]), ...poland.kinds.flatMap((kind) => [kind.name, kind.about, ...(kind.steps ?? [])]), ...poland.glossary.flatMap((entry) => [entry.meaning, entry.tip ?? ''])];
  for (const text of english) assert.ok(!text.includes('\''), text);
});

test('tax sample: decision with payment date, IBAN and 14-day appeal', () => {
  const result = sample('tax');
  assert.equal(result.country.id, 'pl');
  assert.equal(result.sender.id, 'urzad-skarbowy');
  assert.equal(result.kind.id, 'decyzja-podatkowa');
  assert.equal(result.kind.type, 'tax-assessment');
  assert.equal(result.letterDate, '2026-10-09');
  assert.equal(result.objection, 'odwołanie');

  assert.deepEqual(result.dates.map((date) => [date.type, date.iso]), [['objection', '2026-10-26'], ['payment', '2026-11-30']]);
  const payment = result.dates.find((date) => date.type === 'payment');
  assert.equal(payment.estimated, false);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.estimated, true);
  assert.equal(objection.period, '14 days');
  assert.equal(objection.label, 'Last day to object (odwołanie)');

  assert.equal(result.money.toPay.amount, 1234);
  assert.equal(result.money.toPay.currency, 'PLN');
  assert.equal(result.money.toGet, null);
  assert.equal(result.payment.iban, 'PL61 1090 1014 0000 0712 1981 2874');
  assert.equal(result.payment.recipient, 'Urząd Skarbowy Warszawa-Mokotów');
  assert.equal(result.payment.reference, '1434-SPP.4110.123.2026 PCC');
  assert.ok(isValidIban(result.payment.iban));

  assert.deepEqual(values(result), ['1434-SPP.4110.123.2026', '92031512345', '1434-SPP.4110.123.2026 PCC']);
  assert.equal(result.references.find((reference) => reference.local === 'PESEL').personal, true);
  assert.equal(result.references.find((reference) => reference.local === 'Tytułem').payment, true);
  for (const term of ['decyzja', 'odwołanie', 'pouczenie', 'doręczenie', 'odsetki']) assert.ok(result.terms.some((entry) => entry.term === term), term);
});

test('tax sample: steps and replies', () => {
  const result = sample('tax');
  const steps = stepText(result);
  assert.match(steps, /Pay PLN\s1,234\.00 by Mon, 30 Nov 2026 to the account PL61 1090 1014 0000 0712 1981 2874\./);
  assert.match(steps, /payment reference field so they know it’s from you: 1434-SPP\.4110\.123\.2026 PCC/);
  assert.match(steps, /payment plan \(rozłożenie na raty\)/);
  assert.match(steps, /send a written objection \(odwołanie\) by Mon, 26 Oct 2026 \(estimated\)/);
  assert.match(steps, /Write the case reference \(Znak sprawy\) 1434-SPP\.4110\.123\.2026 on every reply/);
  assert.doesNotMatch(steps, /92031512345/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'instalments', 'more-time']);
  const objection = replies.find((reply) => reply.id === 'objection');
  assert.equal(objection.title, 'Object to the decision (odwołanie)');
  assert.match(objection.when, /pouczenie/);
  assert.match(objection.local, /^Odwołanie od decyzji z dnia 09\.10\.2026$/m);
  assert.match(objection.local, /^Niniejszym wnoszę odwołanie od decyzji z dnia 09\.10\.2026\.$/m);
  assert.match(objection.local, /^Wnoszę o uchylenie zaskarżonej decyzji i ponowne rozpatrzenie sprawy\.$/m);
  assert.match(objection.local, /^Znak sprawy: 1434-SPP\.4110\.123\.2026$/m);
  assert.match(objection.local, /^\[Urząd Skarbowy\]$/m);
  assert.match(objection.local, /^Szanowni Państwo,$/m);
  assert.doesNotMatch(objection.local, /PESEL/);
  assert.match(replies.find((reply) => reply.id === 'instalments').local, /wzywają mnie Państwo do zapłaty 1234,00\s+zł\./);
  assert.match(replies.find((reply) => reply.id === 'more-time').local, /termin do 30\.11\.2026\./);
});

test('residence permit sample: appointment with date and time', () => {
  const result = sample('pobyt');
  assert.equal(result.sender.id, 'urzad-wojewodzki');
  assert.equal(result.kind.id, 'wezwanie');
  assert.equal(result.kind.type, 'appointment');
  assert.equal(result.letterDate, '2026-10-08');
  assert.deepEqual(result.dates.map((date) => [date.type, date.iso, date.time]), [['appointment', '2026-10-21', '09:30']]);
  assert.equal(result.money.toPay, null);
  assert.equal(result.payment, null);
  assert.equal(result.objection, null);
  assert.deepEqual(values(result), ['WSC-II-P.6151.12345.2026']);
  assert.ok(result.terms.some((entry) => entry.term === 'zezwolenie na pobyt'));

  const steps = stepText(result);
  assert.match(steps, /Go to the appointment on Wed, 21 Oct 2026 at 09:30/);
  assert.match(steps, /Write the case reference \(Znak sprawy\) WSC-II-P\.6151\.12345\.2026 on every reply/);

  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['reschedule']);
  assert.match(replies[0].local, /Zostałem wezwany \/ Zostałam wezwana na dzień 21\.10\.2026 o godz\. 09:30\./);
  assert.match(replies[0].local, /^\[Urząd Wojewódzki – Wydział Spraw Cudzoziemców\]$/m);
});

test('samples stay relative to the day they are built', () => {
  const today = '2027-03-02';
  const tax = sample('tax', today);
  assert.ok(tax.letterDate && daysBetween(tax.letterDate, today) >= 3);
  assert.ok(tax.dates.find((date) => date.type === 'payment').daysLeft > 30);
  assert.equal(tax.dates.find((date) => date.type === 'objection').estimated, true);
  const pobyt = sample('pobyt', today);
  const appointment = pobyt.dates.find((date) => date.type === 'appointment');
  assert.equal(appointment.time, '09:30');
  assert.ok(appointment.daysLeft >= 8 && appointment.daysLeft <= 10);
});

test('detects Poland from Polish text, even when Germany is preferred', () => {
  for (const id of ['tax', 'pobyt']) {
    assert.equal(analyze(sampleText('pl', id, TODAY), { today: TODAY, preferred: 'de' }).country.id, 'pl', id);
  }
  const court = 'Sąd Rejonowy Lublin-Zachód w Lublinie\nVI Wydział Cywilny\nNakaz zapłaty w postępowaniu upominawczym\nPozwany może w terminie dwóch tygodni od doręczenia nakazu wnieść sprzeciw.';
  assert.equal(analyze(court, { today: TODAY, preferred: 'de' }).country.id, 'pl');
});

test('sample IBAN has a valid checksum', () => {
  assert.equal(isValidIban('PL61 1090 1014 0000 0712 1981 2874'), true);
  assert.equal(isValidIban('PL61 1090 1014 0000 0712 1981 2875'), false);
});

test('senders and kinds in short Polish letters', () => {
  const cases = [
    ['Naczelnik Urzędu Skarbowego w Krakowie\nUPOMNIENIE\nWzywa się do zapłaty zaległości w podatku dochodowym w kwocie 512,00 zł w terminie 7 dni od dnia doręczenia upomnienia, z zagrożeniem skierowania sprawy na drogę postępowania egzekucyjnego.', 'urzad-skarbowy', 'upomnienie'],
    ['Zakład Ubezpieczeń Społecznych Oddział w Łodzi\nDecyzja\nZUS stwierdza, że pobrał Pan nienależnie zasiłek chorobowy i zobowiązuje Pana do zwrotu kwoty 2 345,67 zł.', 'zus', 'zwrot'],
    ['Sąd Rejonowy Lublin-Zachód w Lublinie\nVI Wydział Cywilny\nNakaz zapłaty w postępowaniu upominawczym\nPozwany może w terminie dwóch tygodni od doręczenia nakazu wnieść sprzeciw.', 'sad', 'nakaz-zaplaty'],
    ['Komornik Sądowy przy Sądzie Rejonowym dla Warszawy-Mokotowa\nSygn. akt KM 1234/26\nZawiadomienie o wszczęciu egzekucji\nNa wniosek wierzyciela wszczęto postępowanie egzekucyjne przeciwko dłużnikowi. Dokonuję zajęcia rachunku bankowego.', 'komornik', 'egzekucja'],
    ['Komenda Miejska Policji w Gdańsku\nMandat karny seria DD 1234567\nNałożono grzywnę w wysokości 300 zł za wykroczenie drogowe.', 'policja', 'mandat'],
    ['Główny Inspektorat Transportu Drogowego\nCANARD\nWezwanie do wskazania kierującego\nUrządzenie rejestrujące zarejestrowało przekroczenie dopuszczalnej prędkości. Wzywam Pana do wskazania osoby, której powierzył Pan pojazd do kierowania.', 'gitd', 'braki'],
    ['KRUK S.A.\nPrzedsądowe wezwanie do zapłaty\nNabyliśmy wierzytelność od operatora. Wzywamy Pana do zapłaty kwoty 845,20 zł.', 'windykacja', 'wezwanie-do-zaplaty'],
    ['Wspólnota Mieszkaniowa ul. Lipowa 5\nRozliczenie mediów za rok 2025\nZaliczki na centralne ogrzewanie wpłacone przez lokatora.\nDo zapłaty: 145,20 zł', 'mieszkanie', 'rozliczenie'],
    ['Szanowny Panie,\nwypowiadam umowę najmu lokalu mieszkalnego z zachowaniem trzymiesięcznego okresu wypowiedzenia.\nWynajmujący', 'mieszkanie', 'wypowiedzenie'],
    ['PGE Obrót S.A.\nFaktura VAT nr 12345/2026\nEnergia elektryczna, zużycie 230 kWh\nDo zapłaty: 184,20 zł\nTermin płatności: 25.10.2026', 'energia', 'faktura'],
    ['Miejski Ośrodek Pomocy Społecznej w Poznaniu\nDecyzja\nOrzeka o przyznaniu zasiłku okresowego w kwocie 600,00 zł miesięcznie.', 'mops', 'przyznanie'],
    ['Wojewoda Małopolski\nDecyzja\nOdmawia się udzielenia cudzoziemcowi zezwolenia na pobyt czasowy.\nOd niniejszej decyzji służy odwołanie do Szefa Urzędu do Spraw Cudzoziemców za pośrednictwem Wojewody Małopolskiego w terminie 14 dni od dnia jej doręczenia.', 'urzad-wojewodzki', 'odmowa'],
    ['Wojewoda Mazowiecki\nWezwanie do uzupełnienia braków formalnych\nWzywam Pana do przedłożenia umowy o pracę w terminie 7 dni od dnia doręczenia wezwania, pod rygorem pozostawienia wniosku bez rozpoznania.', 'urzad-wojewodzki', 'braki'],
    ['Powiatowy Urząd Pracy w Toruniu\nWezwanie\nWzywa się Pana do osobistego stawiennictwa w dniu 20.10.2026 r. o godz. 10:00 w celu przedstawienia oferty pracy.', 'urzad-pracy', 'wezwanie'],
    ['Prezydent Miasta Wrocławia\nDecyzja\nw sprawie wymiaru podatku od nieruchomości na rok 2026\nPodatek w kwocie 412,00 zł płatny w ratach.', 'urzad-miasta', 'decyzja-podatkowa'],
    ['Narodowy Fundusz Zdrowia\nWezwanie do zapłaty\nW dniu udzielenia świadczenia nie posiadał Pan ubezpieczenia zdrowotnego.\nKwota do zapłaty: 1 350,00 zł', 'nfz', 'wezwanie-do-zaplaty'],
    ['Naczelnik Urzędu Skarbowego\nPostanowienie\nNa niniejsze postanowienie służy zażalenie w terminie 7 dni od dnia jego doręczenia.', 'urzad-skarbowy', 'postanowienie'],
    ['mBank S.A.\nWypowiedzenie umowy kredytu\nZ powodu zaległości w spłacie rat wypowiadamy umowę kredytu z zachowaniem 30-dniowego okresu wypowiedzenia.', 'bank', 'wypowiedzenie'],
  ];
  for (const [text, sender, kind] of cases) {
    const result = run(text);
    assert.equal(result.sender?.id, sender, text);
    assert.equal(result.kind?.id, kind, text);
  }
});

test('objection words: sprzeciw, zażalenie and no false alarms', () => {
  const nakaz = run('Sąd Rejonowy Lublin-Zachód w Lublinie\nLublin, dnia 07.10.2026 r.\nSygn. akt I C 123/26\nNakaz zapłaty w postępowaniu upominawczym\nPozwany może w terminie dwóch tygodni od doręczenia nakazu wnieść sprzeciw.');
  assert.equal(nakaz.objection, 'sprzeciw');
  assert.deepEqual(values(nakaz), ['I C 123/26']);
  const objection = nakaz.dates.find((date) => date.type === 'objection');
  assert.equal(objection.period, '2 weeks');
  assert.equal(objection.iso, '2026-10-24');
  assert.match(stepText(nakaz), /objection \(sprzeciw\) to the court before the deadline/);
  const replies = buildReplies(nakaz);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection']);
  assert.match(replies[0].local, /^Niniejszym wnoszę sprzeciw od nakazu zapłaty z dnia 07\.10\.2026, zaskarżając go w całości\.$/m);
  assert.match(replies[0].local, /^Sygnatura akt: I C 123\/26$/m);

  const ruling = run('Naczelnik Urzędu Skarbowego\nKraków, dnia 07.10.2026 r.\nPostanowienie\nNa niniejsze postanowienie służy zażalenie w terminie 7 dni od dnia jego doręczenia.');
  assert.equal(ruling.objection, 'zażalenie');
  assert.equal(ruling.dates.find((date) => date.type === 'objection').iso, '2026-10-17');
  assert.match(buildReplies(ruling)[0].local, /^Niniejszym wnoszę zażalenie na postanowienie z dnia 07\.10\.2026\.$/m);

  assert.equal(run('Przysługuje Pani prawo do wniesienia sprzeciwu wobec przetwarzania danych oraz prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.').objection, null);
  assert.equal(run('W razie konieczności odwołania wizyty prosimy o kontakt.').objection, null);
  assert.equal(run('Od niniejszej decyzji nie przysługuje odwołanie.').objection, null);
});

test('ZUS repayment: one-month appeal and a request to cancel the debt', () => {
  const result = run('Zakład Ubezpieczeń Społecznych Oddział w Łodzi\nŁódź, dnia 08.10.2026 r.\nDecyzja\nZUS stwierdza, że pobrał Pan nienależnie zasiłek chorobowy i zobowiązuje Pana do zwrotu kwoty 2 345,67 zł.\nOd decyzji przysługuje odwołanie do Sądu Okręgowego w Łodzi za pośrednictwem ZUS w terminie miesiąca od dnia doręczenia decyzji.');
  assert.equal(result.kind.type, 'repayment');
  assert.equal(result.money.toPay.amount, 2345.67);
  const objection = result.dates.find((date) => date.type === 'objection');
  assert.equal(objection.period, '1 month');
  assert.equal(objection.iso, '2026-11-11');
  const replies = buildReplies(result);
  assert.deepEqual(replies.map((reply) => reply.id), ['objection', 'debt-relief', 'instalments']);
  const relief = replies.find((reply) => reply.id === 'debt-relief');
  assert.match(relief.local, /^Wniosek o umorzenie należności$/m);
  assert.match(relief.local, /W piśmie z dnia 08\.10\.2026 wzywają mnie Państwo do zwrotu kwoty 2345,67\s+zł\./);
});

test('fines, reminders and enforcement get no appeal letter', () => {
  const fine = run('Komenda Miejska Policji w Gdańsku\nMandat karny seria DD 1234567\nNałożono grzywnę w wysokości 300 zł za wykroczenie drogowe.');
  assert.deepEqual(buildReplies(fine), []);
  assert.deepEqual(values(fine), ['DD 1234567']);
  assert.match(stepText(fine), /usually have 7 days to pay/);

  const reminder = run('Naczelnik Urzędu Skarbowego w Krakowie\nKraków, dnia 07.10.2026 r.\nUPOMNIENIE\nWzywa się do zapłaty zaległości w kwocie 512,00 zł w terminie 7 dni od dnia doręczenia upomnienia.');
  assert.deepEqual(buildReplies(reminder).map((reply) => reply.id), ['already-paid', 'instalments']);
  assert.match(buildReplies(reminder)[0].local, /kwotę 512,00\s+zł wpłaciłem\/wpłaciłam w dniu \[data\]\./);
  assert.equal(reminder.dates.find((date) => date.type === 'payment').iso, '2026-10-17');

  const bailiff = run('Komornik Sądowy przy Sądzie Rejonowym dla Warszawy-Mokotowa\nSygn. akt KM 1234/26\nZawiadomienie o wszczęciu egzekucji\nDokonuję zajęcia rachunku bankowego. Do zapłaty: 3 210,00 zł');
  assert.equal(bailiff.kind.type, 'enforcement');
  assert.deepEqual(buildReplies(bailiff).map((reply) => reply.id), ['instalments']);
  assert.match(stepText(bailiff), /Act today/);
});

test('template letters use grammatical Polish', () => {
  const letters = templateLetters(poland);
  const objection = letters.find((letter) => letter.id === 'objection');
  assert.match(objection.local, /^Odwołanie od decyzji z dnia \[DD\.MM\.RRRR\]$/m);
  assert.match(objection.local, /^Niniejszym wnoszę odwołanie od decyzji z dnia \[DD\.MM\.RRRR\]\.$/m);
  assert.match(objection.local, /^\[Miejscowość\], \[DD\.MM\.YYYY\]$/m);
});

test('Polish dates', () => {
  assert.equal(findDates('do dnia 30.11.2026 r.', pl, 'dmy')[0].iso, '2026-11-30');
  assert.equal(findDates('15 listopada 2026 r.', pl, 'dmy')[0].iso, '2026-11-15');
  assert.equal(findDates('Warszawa, 3 marca 2026 r.', pl, 'dmy')[0].iso, '2026-03-03');
  const [appointment] = findDates('w dniu 21.10.2026 r. o godz. 9:30', pl, 'dmy');
  assert.equal(appointment.iso, '2026-10-21');
  assert.equal(appointment.time, '09:30');
});

test('Polish periods', () => {
  const periods = (text) => findPeriods(text, pl).map((period) => [period.amount, period.unit, period.from]);
  assert.deepEqual(periods('w terminie 14 dni od dnia doręczenia'), [[14, 'day', 'doręczenia']]);
  assert.deepEqual(periods('w terminie 7 dni'), [[7, 'day', null]]);
  assert.deepEqual(periods('w terminie miesiąca'), [[1, 'month', null]]);
  assert.deepEqual(periods('w terminie dwóch tygodni od doręczenia'), [[2, 'week', 'doręczenia']]);
});

test('Polish amounts', () => {
  for (const text of ['Kwota: 1 234,56 zł', 'Kwota: PLN 1234,56', 'Kwota: 1.234,56 złotych']) {
    const [item] = findMoney(text, poland).items;
    assert.equal(item.amount, 1234.56, text);
    assert.equal(item.currency, 'PLN', text);
  }
  assert.equal(findMoney('Kwota do zapłaty: 1 234,56 zł', poland).toPay.amount, 1234.56);
});

test('reported gaps: pay verbs, w kwocie, do dopłaty, account without PL, court numbers', () => {
  const run = (text) => analyze(text, { today: '2026-10-14', country: 'pl' });
  assert.deepEqual(run('Warszawa, 09.10.2026 r.\nKwotę należy wpłacić do dnia 30.11.2026 r.').dates.map((date) => date.type), ['payment']);
  assert.equal(run('Wzywamy do zwrotu nienależnie otrzymanej kwoty w kwocie 1 350,00 zł.').money.toPay.amount, 1350);
  assert.equal(run('Zaliczki: 1 200,00 zł\nDo dopłaty: 145,20 zł').money.toPay.amount, 145.2);
  assert.equal(run('Nr rachunku: 61 1090 1014 0000 0712 1981 2874').payment.iban, 'PL61 1090 1014 0000 0712 1981 2874');
  assert.deepEqual(run('Sygn. akt: Km 1234/26\n').references.map((ref) => ref.value), ['Km 1234/26']);
  assert.deepEqual(run('Sygn. akt VI Nc-e 1234567/26 Nakaz').references.map((ref) => ref.value), ['VI Nc-e 1234567/26']);
});

test('appeal period split over two lines by a scan', () => {
  const result = analyze('Warszawa, 09.10.2026 r.\nDECYZJA\nOd niniejszej decyzji służy Panu odwołanie w\nterminie 14 dni od dnia doręczenia decyzji.', { today: '2026-10-14', country: 'pl' });
  assert.ok(result.dates.some((date) => date.type === 'objection'));
});
