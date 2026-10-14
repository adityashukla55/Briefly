import { addDays, formatLocalDate, fromIso } from '../dates.js';

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function lastWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, -1);
  return date;
}

const d = (iso) => formatLocalDate(iso, '.');

function letterOf(result) {
  return result.letterDate ? `z dnia ${d(result.letterDate)}` : 'z dnia [DD.MM.RRRR]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: money.currency ?? 'PLN' }).format(money.amount) : '[kwota]';
}

const OBJECTIONS = {
  'odwołanie': {
    subject: (of) => `Odwołanie od decyzji ${of}`,
    opening: (of) => `Niniejszym wnoszę odwołanie od decyzji ${of}.`,
    reason: 'dlaczego decyzja jest błędna',
    request: 'Wnoszę o uchylenie zaskarżonej decyzji i ponowne rozpatrzenie sprawy.',
  },
  'zażalenie': {
    subject: (of) => `Zażalenie na postanowienie ${of}`,
    opening: (of) => `Niniejszym wnoszę zażalenie na postanowienie ${of}.`,
    reason: 'dlaczego postanowienie jest błędne',
    request: 'Wnoszę o uchylenie zaskarżonego postanowienia.',
  },
  'sprzeciw': {
    subject: (of) => `Sprzeciw od nakazu zapłaty ${of}`,
    opening: (of) => `Niniejszym wnoszę sprzeciw od nakazu zapłaty ${of}, zaskarżając go w całości.`,
    reason: 'dlaczego żądanie zapłaty jest niezasadne',
    request: 'Wnoszę o oddalenie powództwa w całości.',
  },
  'skarga': {
    subject: (of) => `Skarga na [decyzję / czynność komornika] ${of}`,
    opening: (of) => `Niniejszym wnoszę skargę na [decyzję / czynność komornika] ${of}.`,
    reason: 'co jest błędne',
    request: 'Wnoszę o uchylenie zaskarżonej [decyzji / czynności].',
  },
  'reklamacja': {
    subject: (of) => `Reklamacja – pismo ${of}`,
    opening: (of) => `Niniejszym składam reklamację dotyczącą Państwa pisma ${of}.`,
    reason: 'co jest błędne (np. kwota, okres lub opłata)',
    request: 'Proszę o [korektę rachunku / zwrot pobranej kwoty / anulowanie opłaty] i odpowiedź na piśmie.',
  },
};

const objectionFor = (term) => OBJECTIONS[term] ?? OBJECTIONS['odwołanie'];

export default {
  id: 'pl',
  slug: 'poland',
  name: 'Poland',
  adjective: 'Polish',
  language: 'pl',
  currency: 'PLN',
  decimal: ',',
  thousands: ' .',
  dateSeparator: '.',
  dateOrder: 'dmy',
  ibanLength: 28,
  domesticIban: 'PL',
  intro: 'Polish offices send important letters by registered post, or online through ePUAP and e-Doręczenia, and most deadlines start on the day you receive them. If you’re out, the post leaves a notice (awizo) — collect the letter quickly, because it usually counts as delivered after 14 days even if you don’t.',
  signals: [/\bPolsk(?:a|i|iej)\b/, /Rzeczpospolit/i, /\.gov\.pl\b/i, /\.pl\b/i, /\bPL\d{2}(?:\s?\d{4}){6}\b/, /\bPESEL\b/, /\bNIP\b/, /\d\s?(?:zł(?!\p{L})|PLN\b|złotych)/u, /\b\d{2}-\d{3}\s+\p{Lu}\p{Ll}/u, /urz(?:ąd|ędu|ędzie)\s+skarbow/i, /\bZUS\b/, /\bePUAP\b|e-?doręcze/i, /\bul\.\s?\p{Lu}/u, /[łŁ]/, /[ąęĄĘ]/],
  deliveryDays: 3,
  deadlineWords: ['termin', 'do dnia', 'od dnia doręczenia'],
  deliveryNote: 'In Poland, most deadlines start on the day you receive the letter (doręczenie). If you weren’t home, the post leaves a notice (awizo), and a letter you don’t collect usually counts as delivered 14 days after the first notice. The 3 days are only an estimate, so check the date you signed for it.',
  objectionAdvice: 'Use this if you think the decision is wrong. Send it signed, before the deadline, to the address in the instructions (pouczenie) — for a decision, usually through the office that made it. Give your reasons and keep proof that you sent it, for example the receipt for a registered letter.',
  objection: [
    { word: 'odwołanie', pattern: /(?<!\bnie (?:służy|przysługuje) )\bodwołani(?:e|a|u|em)\b(?!\s+(?:wizyty|terminu|spotkania|rezerwacji|zgody))|\bodwoławcz/i },
    { word: 'zażalenie', pattern: /(?<!\bnie (?:służy|przysługuje) )\bzażaleni/i },
    { word: 'sprzeciw', pattern: /\bwnie(?:ść|sienia|sie)\s+sprzeciw\w*\b(?!\s+wobec)|\bsprzeciw\w*\s+od\b/i },
    { word: 'skarga', pattern: /\bskarg[aęi]\s+(?:na\s+(?:czynnoś|decyzj|postanowieni|bezczynnoś)|do\s+(?:wojewódzkiego\s+)?(?:sądu|WSA))/i },
    { word: 'reklamacja', pattern: /\breklamacj/i },
  ],
  help: {
    debt: 'a free legal and debt advice point (nieodpłatna pomoc prawna i poradnictwo obywatelskie) or the social welfare centre in your town (MOPS / GOPS)',
    tenant: 'a free legal aid point (nieodpłatna pomoc prawna), a tenants’ association (stowarzyszenie lokatorów)',
    instalments: 'rozłożenie na raty',
    general: 'a free legal aid point (nieodpłatna pomoc prawna) or the consumer ombudsman in your town or county (rzecznik konsumentów)',
  },
  cancelTips: [
    'Phone and internet: the minimum term can be at most 24 months. After the contract renews by itself, you can cancel any time with 1 month’s notice.',
    'If you could sign a phone or internet contract online or by email, you can cancel it the same way. The company must confirm it within 1 working day.',
    'If you leave a phone or internet contract early, the fee can’t be more than the monthly fees left until the end date.',
    'Car insurance (OC) renews by itself for 12 months, unless you cancel it in writing at least 1 day before it ends.',
    'Energy: a contract with no end date can be cancelled for free. For a home, it ends on the last day of the month after the company gets your letter.',
  ],
  senders: [
    {
      id: 'urzad-skarbowy',
      slug: 'urzad-skarbowy',
      name: 'Tax office',
      local: 'Urząd Skarbowy',
      about: 'Handles income tax (PIT) and other state taxes. It is part of the National Revenue Administration (KAS).',
      patterns: [/urz(?:ąd|ędu|ędzie|ędem)\s+skarbow/i, /izb(?:a|y|ie)\s+administracji\s+skarbowej/i, /krajow(?:a|ej)\s+administracj(?:a|i)\s+skarbow/i, /\bKAS\b/, /podatki\.gov\.pl/i, /\bPIT-\d/i, /\bPCC\b/, /podat(?:ek|ku|kiem)\s+(?:dochodow|od\s+czynności\s+cywilnoprawnych|od\s+spadków)/i, /mikrorachun/i, /ordynacj(?:a|i)\s+podatkow/i],
      letters: ['Decyzja — a decision, for example about tax you owe', 'Upomnienie — a reminder to pay within 7 days, before enforcement starts', 'Wezwanie — they ask you to explain something or send documents', 'Zawiadomienie o zajęciu — they take money from your bank account or wages'],
      tips: ['File your yearly PIT return by 30 April. From 15 February, a pre-filled return (Twój e-PIT) waits for you in e-Urząd Skarbowy on podatki.gov.pl.', 'Since 2020, income tax is paid to your own tax account number (mikrorachunek podatkowy). You can create it on podatki.gov.pl.'],
    },
    {
      id: 'zus',
      slug: 'zus',
      name: 'Social insurance',
      local: 'ZUS',
      about: 'The Social Insurance Institution (Zakład Ubezpieczeń Społecznych). It collects social insurance contributions and pays pensions, sick pay and the 800+ child benefit.',
      patterns: [/\bZUS\b/, /zakład(?:u|zie)?\s+ubezpieczeń\s+społecznych/i, /\bPUE\b|\beZUS\b/, /organ(?:u)?\s+rentow/i, /składk(?:a|i|ę|ami)\s+na\s+ubezpieczeni(?:e|a)\s+społeczn/i, /\bemerytur/i, /zasił(?:ek|ku)\s+chorobow/i, /800\s?(?:\+|plus)/i, /świadczeni(?:e|a)\s+wychowawcz/i],
      letters: ['Decyzja — a decision, for example about a benefit or your contributions', 'Upomnienie or zawiadomienie o zaległości — unpaid contributions', 'Wezwanie do zwrotu nienależnie pobranego świadczenia — they want benefit money back'],
      tips: ['To appeal a ZUS decision, send your appeal (odwołanie) to ZUS. If ZUS doesn’t change its decision, it goes to a court. You usually have 1 month from delivery.', 'Open an account on PUE ZUS (eZUS). You can read your letters and send forms online.'],
    },
    {
      id: 'urzad-wojewodzki',
      slug: 'urzad-wojewodzki',
      name: 'Voivodeship office (residence permits)',
      local: 'Urząd Wojewódzki – Wydział Spraw Cudzoziemców',
      about: 'The regional state office. Its foreigners’ department decides on residence permits and residence cards for people from outside the EU, and registers the stay of EU citizens.',
      patterns: [/urz(?:ąd|ędu|ędzie)\s+wojewódzk/i, /\bwojewod(?:a|y|zie|ę)(?!\p{L})/iu, /wydział(?:u)?\s+spraw\s+cudzoziemców/i, /\bWSC\b/, /zezwoleni(?:e|a|u)\s+na\s+pobyt/i, /kart(?:a|y|ę|ą)\s+pobytu/i, /\bcudzoziem/i, /urz(?:ąd|ędu)\s+do\s+spraw\s+cudzoziemców|\bUdSC\b/i, /odcisk(?:i|ów)\s+linii\s+papilarnych/i, /rejestracj(?:a|i)\s+pobytu/i],
      letters: ['Wezwanie do stawiennictwa — come in person, for example to give fingerprints', 'Wezwanie do uzupełnienia braków — your application is missing papers', 'Decyzja o udzieleniu zezwolenia na pobyt — your permit was granted', 'Decyzja odmowna — your permit was refused'],
      tips: ['Apply for a new permit before your current permit or visa ends. If your application is complete, you can usually stay while they decide.', 'You can appeal a refusal to the Head of the Office for Foreigners (Szef Urzędu do Spraw Cudzoziemców), usually within 14 days of delivery. Send it through the voivodeship office.'],
    },
    {
      id: 'urzad-miasta',
      slug: 'urzad-miasta',
      name: 'Town or city office',
      local: 'Urząd Miasta / Urząd Gminy',
      about: 'Your local council. It handles address registration (meldunek), local taxes like property tax, and the rubbish fee.',
      patterns: [/urz(?:ąd|ędu|ędzie)\s+(?:miasta|gminy|miejski|dzielnicy)/i, /\bprezydent(?:a)?\s+miasta/i, /\bburmistrz/i, /\bwójt/i, /podat(?:ek|ku|kiem)\s+od\s+nieruchomości/i, /opłat(?:a|y|ę)\s+za\s+gospodarowanie\s+odpadami/i, /odpad(?:ami|ów)\s+komunaln/i, /zameldowa|meldunk|wymeldowa/i, /urz(?:ąd|ędu)\s+stanu\s+cywilnego/i, /dow(?:ód|odu)\s+osobist/i],
      letters: ['Decyzja w sprawie podatku od nieruchomości — your yearly property tax, if you own a home', 'Upomnienie — an unpaid rubbish fee or local tax', 'Zaświadczenie o zameldowaniu — proof of your registered address'],
      tips: ['Property tax is usually paid in 4 parts: by 15 March, 15 May, 15 September and 15 November.', 'If you rent, the rubbish fee (opłata za gospodarowanie odpadami) is often included in your monthly payments. Ask your landlord who pays it.'],
    },
    {
      id: 'policja',
      slug: 'policja',
      name: 'Police or city guard',
      local: 'Policja / Straż Miejska',
      about: 'The police and the city guard. They can give fines (mandat), for example for traffic or parking offences.',
      patterns: [/\bpolicj/i, /komend(?:a|y|zie)\s+(?:miejsk|powiatow|rejonow|stołeczn|wojewódzk)/i, /komisariat/i, /straż(?:y)?\s+(?:miejsk|gminn)/i, /\bwykroczeni/i, /mandat(?:u|em)?\s+karn/i, /kodeks(?:u)?\s+wykroczeń/i],
      letters: ['Mandat karny — a fine', 'Wezwanie — they ask you to come in, for example as a witness', 'Wezwanie do wskazania kierującego — they ask who was driving your car'],
      tips: ['You can refuse to accept a mandat. Then the case goes to court.', 'A summons (wezwanie) from the police is important. If you can’t come, call them before the date.'],
    },
    {
      id: 'gitd',
      slug: 'gitd-canard',
      name: 'Road transport inspection (speed cameras)',
      local: 'GITD / CANARD',
      about: 'The Road Transport Inspection (Inspekcja Transportu Drogowego). Its CANARD centre runs the national speed and red-light cameras.',
      patterns: [/\bCANARD\b/i, /\bGITD\b/, /\bITD\b/, /inspekcj(?:a|i)\s+transportu\s+drogowego/i, /inspektor(?:at)?\s+transportu\s+drogowego/i, /fotoradar/i, /urządzeni(?:e|a|em)\s+rejestrując/i, /odcinkow(?:y|ego)\s+pomiar/i, /wskazani(?:a|e)\s+(?:osoby|kierując)/i, /przekroczeni(?:e|a)\s+(?:dopuszczalnej\s+)?prędkości/i],
      letters: ['Wezwanie do wskazania kierującego — they ask who was driving when the camera took the photo', 'Mandat karny — a fine for speeding or driving through a red light'],
      tips: ['As the car owner, you must say who was driving, by the deadline in the letter. If you don’t, you can get a fine yourself.', 'Answer even if someone else was driving or you lent the car. Name the person who had it at that time.'],
    },
    {
      id: 'urzad-pracy',
      slug: 'urzad-pracy',
      name: 'Job centre',
      local: 'Powiatowy Urząd Pracy (PUP)',
      about: 'Registers unemployed people, pays unemployment benefit and helps you find work or training.',
      patterns: [/urz(?:ąd|ędu|ędzie)\s+pracy/i, /\bPUP\b|\bMUP\b/, /\bbezrobotn/i, /poszukując(?:y|ego)\s+pracy/i, /status(?:u)?\s+bezrobotnego/i, /ofert(?:a|y|ę)\s+pracy/i],
      letters: ['Decyzja o uznaniu za osobę bezrobotną — you are registered as unemployed', 'Wezwanie — a required appointment with your adviser', 'Decyzja o utracie statusu bezrobotnego — you lost your unemployed status'],
      tips: ['If you miss an appointment without a good reason, you can lose your unemployed status — and with it your benefit and health insurance.', 'Tell them right away if you start work or get any income.'],
    },
    {
      id: 'nfz',
      slug: 'nfz',
      name: 'National Health Fund',
      local: 'NFZ (Narodowy Fundusz Zdrowia)',
      about: 'Pays for public health care. It checks if you are insured and issues the European Health Insurance Card (EKUZ).',
      patterns: [/\bNFZ\b/, /narodow(?:y|ego|ym)\s+fundusz(?:u|em)?\s+zdrowia/i, /\beWUŚ(?![A-Za-zÀ-ɏ])/i, /\bEKUZ\b/, /ubezpieczeni(?:e|a|u)\s+zdrowotn/i, /dobrowoln(?:e|ego)\s+ubezpieczeni/i, /koszt(?:y|ów)\s+(?:leczenia|świadczeń\s+opieki\s+zdrowotnej)/i],
      letters: ['Wezwanie do zwrotu kosztów leczenia — you were treated while not insured and must pay', 'Decyzja — a decision about your right to public health care', 'EKUZ — your European Health Insurance Card'],
      tips: ['You are usually insured through your job, ZUS, the job centre or a family member. If you are not, you can sign a voluntary insurance agreement with the NFZ.', 'You can check your insurance status in your online patient account (Internetowe Konto Pacjenta).'],
    },
    {
      id: 'sad',
      slug: 'sad',
      name: 'Court',
      local: 'Sąd',
      about: 'A court. Letters from a court are always important — never ignore them.',
      patterns: [/\bsąd(?:u|zie|em)?\s+(?:rejonow|okręgow|apelacyjn|najwyższ|administracyjn)/i, /wojewódzk(?:i|iego)\s+sąd(?:u)?\s+administracyjn/i, /\be-sąd/i, /elektroniczn\w*\s+postępowani\w*\s+upominawcz/i, /\bEPU\b/, /nakaz(?:u|em)?\s+zapłaty/i, /sygn(?:atura|\.)\s*akt/i, /wydział(?:u)?\s+cywiln/i, /\bpozwan/i, /\bpowództw/i, /\brozpraw(?:a|ę|y)\b/i],
      letters: ['Nakaz zapłaty — a court order to pay', 'Odpis pozwu — a copy of a claim someone filed against you', 'Wezwanie na rozprawę — you must come to a hearing', 'Wyrok — a judgment'],
      tips: ['Court deadlines are short and strict, often 1 or 2 weeks. Get free legal advice quickly.', 'If your income is low, you can ask the court to free you from court fees or to give you a free lawyer.'],
    },
    {
      id: 'komornik',
      slug: 'komornik',
      name: 'Bailiff',
      local: 'Komornik sądowy',
      about: 'A court officer who collects debts by force, for example from your bank account or wages. They act for the creditor, based on a court order.',
      patterns: [/komornik/i, /kancelari(?:a|i)\s+komornicz/i, /\bKm\s+\d+\/\d{2}\b/i, /egzekucj(?:a|i|ę)\s+komornicz/i, /wszczęci(?:e|u)\s+(?:egzekucji|postępowania\s+egzekucyjnego)/i, /zajęci(?:e|a|u)\s+(?:rachunku|wynagrodzenia|wierzytelności|świadcze|emerytury|renty)/i, /wierzyciel/i, /dłużni(?:k|ka|czka)/i],
      letters: ['Zawiadomienie o wszczęciu egzekucji — enforcement against you has started', 'Zawiadomienie o zajęciu — they took part of your wages, bank account or other money', 'Wezwanie do zapłaty — a demand to pay the debt and the costs'],
      tips: ['Check who the creditor is and what the debt is for. Write the case number (often starting with Km) on everything you send.', 'You can complain to the court about what a bailiff did (skarga na czynności komornika), usually within 1 week. Get legal advice quickly.'],
    },
    {
      id: 'windykacja',
      slug: 'firma-windykacyjna',
      name: 'Debt collection company',
      local: 'Firma windykacyjna',
      about: 'A company that collects debts, often debts it bought from a bank or phone company. It is not a court or bailiff and can’t take money by force.',
      patterns: [/windykac/i, /\bKRUK\b/i, /\bintrum\b/i, /\bEOS\b/, /\bBEST\s+S\.A\./i, /\bultimo\b/i, /fundusz(?:u)?\s+sekurytyzacyjn/i, /\bsekurytyzac/i, /cesj(?:a|i)\s+wierzytelności|nabył(?:a|o)?\s+wierzytelność|nabywc(?:a|y)\s+wierzytelności/i, /\bugod/i],
      letters: ['Wezwanie do zapłaty — a demand to pay a debt', 'Propozycja ugody — an offer to pay in parts or pay less', 'Informacja o cesji — they bought your debt from someone else'],
      tips: ['Ask for proof of the debt if you don’t recognise it. Old debts can expire (przedawnienie).', 'Don’t sign anything that says you accept the debt (uznanie długu) before you get advice.'],
    },
    {
      id: 'mieszkanie',
      slug: 'wynajmujacy-wspolnota',
      name: 'Landlord or housing association',
      local: 'Wynajmujący / wspólnota / spółdzielnia mieszkaniowa',
      about: 'The owner of your flat, or the association or cooperative that runs your building.',
      patterns: [/wspólnot(?:a|y|ę)\s+mieszkaniow/i, /spółdzielni(?:a|i)?\s+mieszkaniow/i, /zarządc(?:a|y)\s+nieruchomości/i, /\bwynajmując/i, /\bnajemc/i, /umow(?:a|y|ę)\s+najmu/i, /naj(?:em|mu)\s+okazjonaln/i, /\bczynsz/i, /\blokal(?:u)?\s+mieszkaln/i, /\bkaucj/i, /opłat(?:y|a)\s+eksploatacyjn/i],
      letters: ['Rozliczenie mediów — the bill for heating, water and other costs', 'Wezwanie do zapłaty — unpaid rent or fees', 'Wypowiedzenie umowy najmu — notice to end your rental contract', 'Zmiana wysokości opłat — your monthly fees change'],
      tips: ['The owner must return your deposit (kaucja) within 1 month after you move out, minus any money you still owe.', 'With an occasional lease (najem okazjonalny), you signed a notary statement that you will move out when asked. Take every notice seriously and get advice.'],
    },
    {
      id: 'energia',
      slug: 'dostawca-energii',
      name: 'Energy supplier',
      local: 'Dostawca energii (PGE, Tauron, Enea…)',
      about: 'The company that sells you electricity or gas.',
      patterns: [/\bPGE\b/, /\btauron\b/i, /\benea\b/i, /\benerga\b/i, /\bE\.ON\b/i, /\binnogy\b/i, /\bPGNiG\b/i, /\bkWh\b/i, /energi(?:a|i|ę)\s+elektryczn/i, /paliw(?:a|o)\s+gazow/i, /punkt(?:u)?\s+poboru/i, /\bPPE\b|\bPPG\b/, /\btaryf/i, /licznik/i, /sprzedawc(?:a|y)\s+energii/i],
      letters: ['Faktura — your bill', 'Faktura rozliczeniowa — the bill after a meter reading', 'Wezwanie do zapłaty — an unpaid bill', 'Zawiadomienie o wstrzymaniu dostaw — they plan to cut off supply'],
      tips: ['If you can’t pay, call them early and ask for a payment plan. They must warn you in writing before they cut off supply.', 'Send them meter readings regularly, so your bills are based on what you really use.'],
    },
    {
      id: 'bank',
      slug: 'bank-operator',
      name: 'Bank or phone company',
      local: 'Bank / operator telekomunikacyjny',
      about: 'Your bank, or your mobile phone or internet provider.',
      patterns: [/\bPKO\b/, /\bpekao\b/i, /\bmbank\b/i, /santander/i, /\bING\b/, /millennium/i, /\balior/i, /credit\s+agricole/i, /\bBNP\b/, /umow(?:a|y|ę)\s+kredyt/i, /\bkredyt/i, /\bpożyczk/i, /\borange\b/i, /\bT-Mobile\b/i, /\bP4\b|\bplay\b/i, /operator(?:a)?\s+telekomunikacyjn/i, /usług(?:i|a)?\s+telekomunikacyjn/i, /\babonament/i],
      letters: ['Wezwanie do zapłaty — an overdue loan instalment or bill', 'Wypowiedzenie umowy — they end your contract', 'Faktura — your monthly bill'],
      tips: ['If you can’t pay a loan instalment, tell the bank early. You can ask for a new repayment plan (restrukturyzacja).', 'For problems with a bank or insurer, first send them a complaint (reklamacja). If that doesn’t help, the Financial Ombudsman (Rzecznik Finansowy) can step in.'],
    },
    {
      id: 'mops',
      slug: 'osrodek-pomocy-spolecznej',
      name: 'Social welfare centre',
      local: 'Ośrodek Pomocy Społecznej (MOPS / GOPS)',
      about: 'Your town’s social services. It pays social help and some family benefits, and can help with money problems.',
      patterns: [/ośrod(?:ek|ka|ku)\s+pomocy\s+społecznej/i, /\bMOPS\b|\bMOPR\b|\bGOPS\b|\bMGOPS\b/, /pomoc(?:y)?\s+społeczn/i, /centrum\s+usług\s+społecznych/i, /zasił(?:ek|ku)\s+(?:rodzinn|okresow|celow|stał)/i, /świadcze(?:nie|nia|ń)\s+rodzinn/i, /fundusz(?:u)?\s+alimentacyjn/i, /dodat(?:ek|ku)\s+mieszkaniow/i, /pracownik(?:a)?\s+socjaln/i],
      letters: ['Decyzja o przyznaniu — you get a benefit', 'Decyzja odmowna — your application was refused', 'Decyzja o zwrocie nienależnie pobranych świadczeń — they want money back'],
      tips: ['Appeals against their decisions usually go to the Local Government Appeals Board (Samorządowe Kolegium Odwoławcze). You usually have 14 days from delivery, and you send the appeal through the centre.', 'Tell them right away if your income or household changes.'],
    },
  ],
  kinds: [
    {
      id: 'egzekucja', type: 'enforcement', local: 'Egzekucja / zajęcie', name: 'Enforcement notice', about: 'They are taking the money by force, for example from your bank account, wages or benefits. It can come from a bailiff (komornik) or from an office like the tax office or ZUS.', urgency: 'high', objection: false, extendable: false,
      patterns: [/tytuł(?:u|em)?\s+wykonawcz/i, /zawiadomieni(?:e|a)\s+o\s+(?:wszczęciu\s+egzekucji|zajęciu)/i, /wszczęci(?:e|u)\s+(?:egzekucji|postępowania\s+egzekucyjnego)/i, /zajęci(?:e|a|u)\s+(?:rachunku|wynagrodzenia|wierzytelności|świadcze|emerytury|renty|ruchomości|nieruchomości)/i, /dokon(?:uje|ał|ałem|ano)\s+(?:się\s+)?zajęcia/i, /egzekucj(?:a|i|ę)\s+(?:komornicz|administracyjn)/i],
      steps: ['Part of your wages and of the money in your bank account is protected each month. If you think too much was taken, ask your bank or employer, and the bailiff or office.', 'If you think the debt is wrong or already paid, get free legal advice quickly. Some complaints have a deadline of only 7 days.'],
    },
    {
      id: 'nakaz-zaplaty', type: 'court-order', local: 'Nakaz zapłaty', name: 'Court payment order', about: 'A court order to pay, made without a hearing. If you don’t owe the money, you must object (sprzeciw) fast — usually within 2 weeks of delivery. If you do nothing, it becomes final and can be enforced.', urgency: 'high', extendable: false,
      patterns: [/nakaz(?:u|em)?\s+zapłaty/i, /postępowani(?:e|u|a)\s+upominawcz/i, /postępowani(?:e|u|a)\s+nakazow/i, /\be-sąd/i, /\bEPU\b/],
      steps: ['If you really owe this money, pay it. The order says how much, including costs.', 'If you don’t owe it, or not all of it, send an objection (sprzeciw) to the court before the deadline — usually 2 weeks from delivery. Follow the instructions (pouczenie) that came with it, and get free legal advice quickly.'],
    },
    {
      id: 'zwrot', type: 'repayment', local: 'Zwrot nienależnie pobranych świadczeń', name: 'Request to pay money back', about: 'They believe they paid you a benefit you were not entitled to, and want the money back.', urgency: 'high',
      patterns: [/\bnienależn/i, /do\s+zwrotu\s+(?:kwoty|świadcze|zasiłku|nienależnie)/i, /zwrot(?:u)?\s+(?:nienależnie|świadczeni|zasiłku|pobranego)/i, /obowiązek\s+zwrotu/i, /zobowiązuj(?:e|ę)\s+(?:się\s+)?(?:pana|panią|stronę)\s+do\s+zwrotu/i],
      steps: ['Check the period and the amount. If you don’t understand how they worked it out, ask them to explain.', 'If paying it back would be very hard for you, you can ask them to cancel the debt (umorzenie) or let you pay in parts. There is a ready-made letter below.'],
    },
    {
      id: 'mandat', type: 'fine', local: 'Mandat karny', name: 'Fine', about: 'A fine for a minor offence, for example speeding or wrong parking. If you accept it, you usually have 7 days to pay.', urgency: 'high', objection: false, extendable: false, instalments: false,
      patterns: [/mandat(?:u|em)?\s+karn/i, /\bmandat/i, /\bgrzywn(?:a|ę|y)\s+w\s+(?:wysokości|kwocie)/i, /nałożon(?:o|a)\s+(?:na\s+\p{L}+\s+)?grzywn/iu, /punkt(?:y|ów)\s+karn/i, /wykroczeni(?:e|a)\s+drogow/i],
      steps: ['A fine you accepted is final. You usually have 7 days to pay it — check the ticket for the exact amount and account.', 'If you haven’t accepted the fine yet and think it’s wrong, you can refuse it. Then a court decides the case. Get advice first.'],
    },
    {
      id: 'upomnienie', type: 'reminder', local: 'Upomnienie', name: 'Formal reminder before enforcement', about: 'A formal reminder from an office, for example the tax office, ZUS or your town. If you don’t pay within 7 days of delivery, they can start enforcement and add costs.', urgency: 'high', objection: false, extendable: false,
      patterns: [/\bupomnieni/i, /koszt(?:y|ów)\s+upomnienia/i, /skierowani(?:a|e)\s+sprawy\s+na\s+drogę\s+postępowania\s+egzekucyjnego/i],
      steps: ['Pay within 7 days after you received it, or contact the office now and ask to pay in instalments (rozłożenie na raty).'],
    },
    {
      id: 'wezwanie-do-zaplaty', type: 'reminder', local: 'Wezwanie do zapłaty', name: 'Demand to pay', about: 'A demand to pay money you owe, for example from a company, your landlord or a debt collector. It is not a court order, but they may go to court next.', urgency: 'high',
      patterns: [/wezwani(?:e|a|u)\s+do\s+zapłaty/i, /przedsądow/i, /ostateczn(?:e|ego)\s+wezwani/i, /wzywa(?:my|m)?\s+(?:pana|panią|państwa)?\s*do\s+(?:zapłaty|uregulowania|spłaty)/i, /zaległoś(?:ć|ci)\s+w\s+(?:opłatach|płatnościach|spłacie)/i, /nie\s+odnotowaliśmy\s+(?:wpłaty|płatności)/i, /nieuregulowan/i, /\bzadłużeni/i],
      steps: ['If you don’t recognise the debt, ask in writing for proof, for example the contract and how they worked out the amount. Don’t sign anything that says you accept the debt before you check it.'],
    },
    {
      id: 'wezwanie', type: 'appointment', local: 'Wezwanie do stawiennictwa', name: 'Summons to appear', about: 'They want you to come in person, for example to give fingerprints, answer questions or collect a document. If you can’t come, tell them before the date.', urgency: 'medium',
      patterns: [/wezwani(?:e|a)\s+do\s+(?:osobistego\s+)?stawiennictwa/i, /\bstawiennictw/i, /\b(?:nie\s*)?stawi(?:ć|enia|ł|ła)?\s+się/i, /zgłosić\s+się\s+(?:osobiście|w\s+dniu|do)/i, /wezwani(?:e|a)\s+na\s+(?:rozprawę|przesłuchanie|posiedzenie)/i, /termin(?:ie)?\s+wizyty/i, /odcisk(?:i|ów)\s+linii\s+papilarnych/i, /w\s+charakterze\s+(?:świadka|strony)/i, /zaprasza(?:my|m)\s+(?:pana|panią|na)/i],
      steps: ['Bring this letter, your passport or ID card, and every document listed. Arrive a little early.'],
    },
    {
      id: 'braki', type: 'documents', local: 'Wezwanie do uzupełnienia braków', name: 'Request for documents', about: 'They need papers or information before they can continue. If you don’t send them in time — often 7 days — they may stop handling your application (pozostawienie bez rozpoznania).', urgency: 'medium',
      patterns: [/uzupełnieni(?:e|a)\s+braków/i, /brak(?:ów|i)\s+formaln/i, /brakując(?:e|ych)\s+dokument/i, /wzywa(?:m|my)?\s+(?:\p{L}+\s+){0,2}do\s+(?:przedłożenia|dostarczenia|uzupełnienia|złożenia|przedstawienia|nadesłania|przesłania|wskazania)/iu, /pozostawi(?:ony|ona|one|enie|a)?\s+bez\s+rozpoznania/i, /prosimy\s+o\s+(?:przesłanie|dostarczenie|uzupełnienie|przedłożenie)/i, /wskazani(?:a|e)\s+(?:osoby|kierującego)/i],
      steps: ['If you can’t get a document in time, write to them before the deadline. Explain why and say when you can send it.'],
    },
    {
      id: 'odmowa', type: 'rejection', local: 'Decyzja odmowna', name: 'Rejection', about: 'Your application was refused. You can usually appeal (odwołanie) — the instructions at the end (pouczenie) say where and by when, often 14 days from delivery.', urgency: 'medium',
      patterns: [/decyzj(?:a|ę|i)\s+odmown/i, /odmawia\s+(?:się\s+)?(?:\p{L}+\s+){0,2}(?:udzielenia|przyznania|wydania|wszczęcia|zwrotu)/iu, /odmow(?:a|ie|ę|y)\s+(?:udzielenia|przyznania|wydania)/i, /orzeka\s+o\s+odmowie/i, /nie\s+uwzględnia\s+się/i, /\bodmownie\b/i],
      steps: ['Read the reasons (uzasadnienie) and the instructions (pouczenie). The deadline to appeal is often short, so get free legal advice quickly.'],
    },
    {
      id: 'decyzja-podatkowa', type: 'tax-assessment', local: 'Decyzja podatkowa / PIT', name: 'Tax decision', about: 'A decision about how much tax you owe, for example from the tax office or your town. You can usually appeal within 14 days of delivery.', urgency: 'medium',
      patterns: [/decyzj(?:a|ę|i)\s+(?:określając|ustalając)/i, /zobowiązani(?:e|a|u)\s+podatkow/i, /\bPIT(?:-\d+\w*)?\b/, /podat(?:ek|ku|kiem)\s+dochodow/i, /podat(?:ek|ku|kiem)\s+od\s+(?:czynności\s+cywilnoprawnych|spadków|nieruchomości)/i, /\bPCC\b/, /zeznani(?:e|a|u)\s+podatkow/i, /wymiar(?:ze|u)?\s+podatku/i, /ordynacj(?:a|i)\s+podatkow/i],
      steps: ['Check the figures against your own papers. If something is wrong, you can appeal (odwołanie), usually within 14 days of delivery.'],
    },
    { id: 'przyznanie', type: 'approval', local: 'Decyzja o przyznaniu / udzieleniu', name: 'Approval', about: 'Your application was approved, for example a benefit or a residence permit. The letter shows what you get and for how long.', urgency: 'low', patterns: [/decyzj(?:a|ę|i)\s+o\s+(?:przyznaniu|udzieleniu)/i, /\bprzyznaje\b/i, /\budziela\s+(?:się\s+)?(?:\p{L}+\s+){0,3}zezwolenia/iu, /orzeka\s+o\s+(?:przyznaniu|udzieleniu)/i, /wniosek\s+(?:został\s+)?(?:rozpatrzony\s+pozytywnie|uwzględniony)/i, /\bprzyznan(?:o|y|e)\s+(?:pan|pani|świadczeni|zasił|prawo)/i] },
    {
      id: 'wypowiedzenie', type: 'termination', local: 'Wypowiedzenie', name: 'Termination notice', about: 'A contract is being ended, for example your rental, your job or a phone contract.', urgency: 'high', objection: false,
      patterns: [/wypowiedzeni(?:e|a|u)\s+(?:umowy|najmu|stosunku)/i, /wypowiada(?:m|my)?\s+(?:\p{L}+\s+){0,2}umow/iu, /rozwiązani(?:e|a|u)\s+umowy/i, /rozwiązuj(?:e|ę|emy)\s+(?:\p{L}+\s+){0,2}(?:umowę|stosunek)/iu, /okres(?:u|ie)?\s+wypowiedzenia/i],
      steps: ['If your employer ended your work contract (umowa o pracę) and you think it’s wrong, you can appeal to the labour court (sąd pracy) within 21 days of getting the notice.'],
    },
    {
      id: 'rozliczenie', type: 'utility-bill', local: 'Rozliczenie mediów', name: 'Utility bill', about: 'The bill for heating, water and other costs in your flat or building. You may pay extra or get money back.', urgency: 'medium',
      patterns: [/rozliczeni(?:e|a|u)\s+(?:mediów|kosztów\s+(?:ciepła|ogrzewania|wody|zużycia|dostawy)|zaliczek|ciepła|wody|centralnego|opłat\s+za\s+media)/i, /faktur(?:a|y|ę)\s+rozliczeniow/i, /zaliczk(?:a|i|ami|om)?\s+na\s+(?:media|ogrzewanie|wodę|ciepło|c\.o\.|centralne)/i, /centraln(?:e|ego)\s+ogrzewani/i, /ciepł(?:a|ej)\s+wod/i, /zimn(?:a|ej)\s+wod/i, /podzielnik/i],
      steps: ['Compare it with the advance payments (zaliczki) you already paid. You can ask them how they worked it out.'],
    },
    { id: 'faktura', type: 'bill', local: 'Faktura / rachunek', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bfaktur/i, /\brachun(?:ek|ku)\s+(?:nr|za)\b/i, /prognoz(?:a|y)\s+(?:zużycia|na\s+okres)/i] },
    { id: 'postanowienie', type: 'decision', local: 'Postanowienie', name: 'Ruling', about: 'A ruling on one step in your case, not the final decision. Some rulings can be challenged with a complaint (zażalenie), usually within 7 days of delivery — the letter says if you can.', urgency: 'medium', weight: 0.5, patterns: [/\bpostanowienie\b/i, /\bpostanawia\b/i, /(?<!\bnie (?:służy|przysługuje) )\bzażaleni/i] },
    { id: 'decyzja', type: 'decision', local: 'Decyzja', name: 'Official decision', about: 'A formal decision by an office. It becomes final if you don’t appeal in time — often 14 days from delivery, but check the instructions (pouczenie).', urgency: 'medium', weight: 0.4, patterns: [/\bdecyzj/i] },
  ],
  references: [
    { name: 'Case reference', local: 'Znak sprawy', pattern: /(?:znak\s+sprawy|nasz\s+znak|znak\s+pisma)/gi },
    { name: 'Court case number', local: 'Sygnatura akt', pattern: /(?:sygnatur[aęy]\s+akt|sygn\.\s?akt|\bsygn\.)/gi },
    { name: 'Case number', local: 'Numer sprawy', pattern: /(?:numer\s+sprawy|nr\s+sprawy)/gi },
    { name: 'Decision number', local: 'Numer decyzji', pattern: /(?:numer\s+decyzji|nr\s+decyzji|decyzj[aię]\s+nr)/gi },
    { name: 'Fine number', local: 'Numer mandatu', pattern: /(?:seria\s+i\s+numer\s+mandatu|numer\s+mandatu|nr\s+mandatu|mandat(?:\s+karny)?\s+(?:seria|nr))/gi },
    { name: 'Contract number', local: 'Numer umowy', pattern: /(?:numer\s+umowy|nr\s+umowy|umow[aęy]\s+nr)/gi },
    { name: 'Customer number', local: 'Numer klienta', pattern: /(?:numer\s+klienta|nr\s+klienta|id\s+klienta)/gi },
    { name: 'Invoice number', local: 'Numer faktury', pattern: /(?:numer\s+faktury|nr\s+faktury|faktur[aęy](?:\s+VAT)?\s+nr)/gi },
    { name: 'Personal ID number', local: 'PESEL', personal: true, pattern: /\bPESEL\b/g },
    { name: 'Tax ID', local: 'NIP', pattern: /\bNIP\b/g },
    { name: 'Payment reference', local: 'Tytułem', payment: true, pattern: /(?:tytułem|tytuł\s+(?:przelewu|wpłaty))/gi },
  ],
  glossary: [
    { term: 'decyzja', slug: 'decyzja', pattern: /\bdecyzj/i, meaning: 'Official decision by an office. It becomes final if you don’t appeal in time.', tip: 'Read the instructions at the end (pouczenie). They say if you can appeal, to whom, and by when — often 14 days from delivery.' },
    { term: 'postanowienie', slug: 'postanowienie', pattern: /postanowieni|postanawia/i, meaning: 'Ruling on one step in a case, not the final decision. Some rulings can be challenged with a complaint (zażalenie).' },
    { term: 'odwołanie', slug: 'odwolanie', pattern: /\bodwołani(?:e|a|u|em)\b(?!\s+(?:wizyty|terminu|spotkania|rezerwacji|zgody))|\bodwoławcz/i, meaning: 'Appeal against a decision. You usually send it through the office that made the decision.', tip: 'For most office and tax decisions you have 14 days from delivery. For ZUS decisions it’s usually 1 month. The pouczenie says which applies.' },
    { term: 'zażalenie', slug: 'zazalenie', pattern: /zażaleni/i, meaning: 'Complaint against a ruling (postanowienie). The deadline is usually 7 days from delivery.' },
    { term: 'sprzeciw', slug: 'sprzeciw', pattern: /\bsprzeciw/i, meaning: 'Objection, for example to a court payment order (nakaz zapłaty). If you send it in time, the order stops and the court looks at the case properly.', tip: 'You usually have 2 weeks from delivery. Give your reasons and evidence, and follow the pouczenie that came with the order.' },
    { term: 'skarga', slug: 'skarga', pattern: /\bskarg/i, meaning: 'Complaint. For example to an administrative court (sąd administracyjny), or about what a bailiff did (skarga na czynności komornika).' },
    { term: 'pouczenie', slug: 'pouczenie', pattern: /pouczeni/i, meaning: 'Instructions at the end of a letter. They explain your rights: if you can appeal, where, and by when.' },
    { term: 'uzasadnienie', slug: 'uzasadnienie', pattern: /uzasadnieni/i, meaning: 'The reasons for a decision. Read it to see what to argue in an appeal.' },
    { term: 'termin', slug: 'termin', pattern: /\btermin/i, meaning: 'Deadline or date. “W terminie 14 dni” means “within 14 days”.', tip: 'Most deadlines count from the day you received the letter, not the date printed on it. If the last day is a Saturday, Sunday or public holiday, the deadline moves to the next working day.' },
    { term: 'doręczenie', slug: 'doreczenie', pattern: /doręcz/i, meaning: 'Delivery — the day you received the letter. Most deadlines start from this day.' },
    { term: 'awizo', slug: 'awizo', pattern: /\bawiz/i, meaning: 'Notice from the post office that a registered letter is waiting for you.', tip: 'Collect the letter quickly. If you don’t, it usually counts as delivered after 14 days anyway, and the deadlines start.' },
    { term: 'przywrócenie terminu', slug: 'przywrocenie-terminu', pattern: /przywróceni\w*\s+terminu/i, meaning: 'Reopening a deadline you missed through no fault of your own, for example because you were in hospital.', tip: 'Ask within 7 days after the reason ends, and send the missing appeal or document at the same time.' },
    { term: 'pełnomocnictwo', slug: 'pelnomocnictwo', pattern: /pełnomocni/i, meaning: 'Power of attorney. A signed paper that lets someone else act for you, for example a lawyer or a friend.' },
    { term: 'wezwanie', slug: 'wezwanie', pattern: /\bwezwani|\bwzywa/i, meaning: 'Official request. They want you to do something — come in, send papers or pay — by a set date.' },
    { term: 'upomnienie', slug: 'upomnienie', pattern: /\bupomnieni/i, meaning: 'Official reminder to pay. If you don’t pay within 7 days of delivery, enforcement can start.', tip: 'Pay quickly, or ask for instalments right away. Enforcement adds more costs.' },
    { term: 'egzekucja', slug: 'egzekucja', pattern: /egzekuc/i, meaning: 'Enforcement. Collecting a debt by force, for example from your bank account or wages.' },
    { term: 'komornik', slug: 'komornik', pattern: /komorni/i, meaning: 'Court bailiff. Collects debts by force for a creditor, based on a court order.' },
    { term: 'zajęcie', slug: 'zajecie', pattern: /zajęci(?:e|a|u)\s+(?:rachunku|wynagrodzenia|wierzytelności|świadcze|emerytury|renty|ruchomości)|o\s+zajęciu/i, meaning: 'Seizure. Money is taken from your bank account, wages or benefits to pay a debt.', tip: 'Part of your wages and of the money in your bank account is protected each month. Ask your bank or the bailiff if you think too much was taken.' },
    { term: 'tytuł wykonawczy', slug: 'tytul-wykonawczy', pattern: /tytuł(?:u|em)?\s+wykonawcz/i, meaning: 'The official paper that allows a debt to be collected by force.' },
    { term: 'nakaz zapłaty', slug: 'nakaz-zaplaty', pattern: /nakaz(?:u|em)?\s+zapłaty/i, meaning: 'Court payment order. The court orders you to pay without a hearing first.', tip: 'If you don’t agree, send a sprzeciw before the deadline — usually 2 weeks. If you do nothing, it becomes final and can be enforced.' },
    { term: 'e-Sąd', slug: 'e-sad', pattern: /\be-sąd|elektroniczn\w*\s+postępowani\w*\s+upominawcz|\bEPU\b/i, meaning: 'Online court for payment orders (elektroniczne postępowanie upominawcze, EPU). Debt collectors use it a lot.' },
    { term: 'mandat', slug: 'mandat', pattern: /\bmandat/i, meaning: 'Fine for a minor offence, for example from the police or the city guard.' },
    { term: 'grzywna', slug: 'grzywna', pattern: /\bgrzywn/i, meaning: 'Fine. Money you pay as a penalty.' },
    { term: 'odsetki', slug: 'odsetki', pattern: /\bodset(?:ki|ek|kami|kach|kom)\b/i, meaning: 'Interest. Extra money added because you paid late.' },
    { term: 'zaległość', slug: 'zaleglosc', pattern: /zaległoś/i, meaning: 'Arrears. Money you should have paid already.' },
    { term: 'rozłożenie na raty', slug: 'rozlozenie-na-raty', pattern: /rozłożeni\w*\s+(?:\p{L}+\s+)?na\s+raty|\bna\s+raty\b|\bw\s+ratach\b/iu, meaning: 'Paying a debt in instalments.', tip: 'Ask in writing before the deadline. Explain your income and costs, and add proof.' },
    { term: 'umorzenie', slug: 'umorzenie', pattern: /umorzeni|umarza/i, meaning: 'Cancelling a debt, or closing a case. Check which one your letter means.' },
    { term: 'przedawnienie', slug: 'przedawnienie', pattern: /przedawni/i, meaning: 'Expiry of a claim after a time limit, often 3 or 6 years. After that, a court usually can’t make a consumer pay.' },
    { term: 'PESEL', slug: 'pesel', pattern: /\bPESEL\b/, meaning: 'Your 11-digit Polish personal ID number. Offices use it to find your file.' },
    { term: 'NIP', slug: 'nip', pattern: /\bNIP\b/, meaning: 'Tax ID number. If you don’t run a business, you usually use your PESEL instead.' },
    { term: 'meldunek', slug: 'meldunek', pattern: /meldun|zameldowa/i, meaning: 'Registering your address at the town or city office.' },
    { term: 'karta pobytu', slug: 'karta-pobytu', pattern: /kart(?:a|y|ę|ą|cie)\s+pobytu/i, meaning: 'Residence card. The plastic card that shows your residence permit.' },
    { term: 'zezwolenie na pobyt', slug: 'zezwolenie-na-pobyt', pattern: /zezwoleni(?:e|a|u|em)\s+na\s+pobyt/i, meaning: 'Residence permit, for example temporary (czasowy) or permanent (stały).' },
    { term: 'ZUS', slug: 'zus', pattern: /\bZUS\b/, meaning: 'Social Insurance Institution. It collects contributions and pays pensions, sick pay and 800+.' },
    { term: 'składka', slug: 'skladka', pattern: /\bskładk/i, meaning: 'Contribution, for example for social or health insurance.' },
    { term: 'PIT', slug: 'pit', pattern: /\bPIT\b/, meaning: 'Personal income tax, and the yearly tax return forms (PIT-37, PIT-36…).', tip: 'File your return by 30 April. A pre-filled return (Twój e-PIT) is ready in e-Urząd Skarbowy from 15 February.' },
    { term: 'Urząd Skarbowy', slug: 'urzad-skarbowy', pattern: /urz(?:ąd|ędu|ędzie|ędem)\s+skarbow/i, meaning: 'Tax office (US). It handles income tax and other state taxes.' },
    { term: 'e-Urząd Skarbowy', slug: 'e-urzad-skarbowy', pattern: /e-urz(?:ąd|ędu|ędzie)\s+skarbow|podatki\.gov\.pl/i, meaning: 'The tax office’s online service on podatki.gov.pl. You can file returns, pay and write to the office there.' },
    { term: 'profil zaufany', slug: 'profil-zaufany', pattern: /profil(?:u|em)?\s+zaufan/i, meaning: 'Free online ID for Polish public services. You use it to log in and sign forms online.', tip: 'You can set it up online through many Polish banks, or in person at an office. You need a PESEL.' },
    { term: 'ePUAP', slug: 'epuap', pattern: /\bePUAP\b/i, meaning: 'Online platform for writing to Polish offices. You log in with a profil zaufany.' },
    { term: 'e-Doręczenia', slug: 'e-doreczenia', pattern: /e-?doręcze/i, meaning: 'Electronic registered mail for official letters. A letter sent there counts like a registered letter on paper.' },
    { term: 'sygnatura akt', slug: 'sygnatura-akt', pattern: /sygnatur(?:a|y|ę)\s+akt|\bsygn\.\s?akt/i, meaning: 'Court case number. Write it on every letter to the court or bailiff.' },
    { term: 'znak sprawy', slug: 'znak-sprawy', pattern: /znak\s+sprawy|nasz\s+znak/i, meaning: 'Case reference of an office. Write it on every reply.' },
    { term: 'kaucja', slug: 'kaucja', pattern: /\bkaucj/i, meaning: 'Deposit, usually for a rented flat. The owner must return it within 1 month after you move out, minus money you still owe.' },
    { term: 'czynsz', slug: 'czynsz', pattern: /\bczynsz/i, meaning: 'Rent. It can also mean the monthly fee to the housing association or cooperative.' },
    { term: 'wypowiedzenie', slug: 'wypowiedzenie', pattern: /wypowiedzeni|wypowiada/i, meaning: 'Notice to end a contract, for example for a flat, a job or a phone contract.' },
    { term: 'okres wypowiedzenia', slug: 'okres-wypowiedzenia', pattern: /okres(?:u|ie)?\s+wypowiedzenia/i, meaning: 'Notice period. The time between the notice and the end of the contract.' },
    { term: 'najem okazjonalny', slug: 'najem-okazjonalny', pattern: /naj(?:em|mu|mie)\s+okazjonaln/i, meaning: 'Occasional lease. A rental contract with a notary statement that makes eviction faster.' },
    { term: 'opłata skarbowa', slug: 'oplata-skarbowa', pattern: /opłat(?:a|y|ę|ą)?\s+skarbow/i, meaning: 'Stamp duty. A fee for some official documents and permits, paid to the town or city.' },
    { term: 'nieodpłatna pomoc prawna', slug: 'nieodplatna-pomoc-prawna', pattern: /nieodpłatn\S*\s+pomoc\S*\s+prawn|nieodpłatn\S*\s+poradnictw/i, meaning: 'Free legal help at local advice points. Anyone who can’t afford a lawyer can use it.', tip: 'Book an appointment at np.ms.gov.pl or through your town or county office.' },
  ],
  replies: {
    objection: {
      subject: (term, of) => objectionFor(term).subject(of),
      body: (term, of) => {
        const entry = objectionFor(term);
        return [
          entry.opening(of),
          '',
          `Uzasadnienie: [Proszę w kilku zdaniach wyjaśnić, ${entry.reason}, i wskazać dowody.]`,
          '',
          entry.request,
          '',
          'Proszę o potwierdzenie otrzymania tego pisma.',
        ];
      },
    },
  },
  extraReplies: [
    {
      id: 'debt-relief',
      title: 'Ask to cancel the debt (wniosek o umorzenie)',
      advice: 'Use this if you must pay money back but your situation is very hard. Explain your income, costs and family situation, and add proof. They decide case by case.',
      english: 'You asked me to pay back [amount]. My financial situation is very hard because [reason]. I ask you to cancel all or part of this debt. I attach proof of my income and costs.',
      subject: 'Wniosek o umorzenie należności',
      body: (result) => [
        `W piśmie ${letterOf(result)} wzywają mnie Państwo do zwrotu kwoty ${amountOf(result)}.`,
        'Moja sytuacja finansowa nie pozwala mi na spłatę tej kwoty, ponieważ [proszę opisać: dochody, wydatki, sytuację rodzinną, stan zdrowia].',
        '',
        'Dlatego wnoszę o umorzenie tej należności w całości lub w części.',
        '',
        'W załączeniu przesyłam dokumenty potwierdzające moje dochody i wydatki.',
      ],
      when: (result) => result.kind?.type === 'repayment',
    },
    {
      id: 'already-paid',
      title: 'Tell them you already paid',
      advice: 'Use this if you already paid. Add a copy of the bank transfer confirmation.',
      english: 'About your letter dated [date]: I already paid [amount] on [date]. I attach the transfer confirmation. Please record the payment and confirm that I owe nothing more.',
      subject: 'Informacja o dokonanej wpłacie',
      body: (result) => [
        `W odpowiedzi na pismo ${letterOf(result)} informuję, że kwotę ${amountOf(result)} wpłaciłem/wpłaciłam w dniu [data].`,
        'W załączeniu przesyłam potwierdzenie przelewu.',
        '',
        'Proszę o zaksięgowanie tej wpłaty i potwierdzenie, że nie mam już zaległości.',
      ],
      when: (result) => result.kind?.type === 'reminder',
    },
    {
      id: 'send-documents',
      title: 'Send the documents they asked for',
      advice: 'Use this as a cover letter when you send the papers. List every document, keep copies, and keep proof that you sent it.',
      english: 'In reply to your letter dated [date], I am sending the documents you asked for: [list]. Please confirm that you received them.',
      subject: 'Uzupełnienie dokumentów',
      body: (result) => [
        `W odpowiedzi na wezwanie ${letterOf(result)} przesyłam następujące dokumenty:`,
        '1. [Dokument 1]',
        '2. [Dokument 2]',
        '3. [Dokument 3]',
        '',
        'Proszę o potwierdzenie otrzymania tego pisma i załączników.',
      ],
      when: (result) => result.kind?.type === 'documents',
    },
  ],
  samples: [
    {
      id: 'tax',
      title: 'Tax office',
      subtitle: 'Tax decision with a payment date',
      build(today) {
        const letter = lastWorkday(addDays(today, -3));
        const due = nextWorkday(addDays(letter, 52));
        const contract = addDays(today, -150);
        return `Naczelnik Urzędu Skarbowego Warszawa-Mokotów
ul. Przykładowa 10
02-123 Warszawa

Warszawa, dnia ${d(letter)} r.

Znak sprawy: 1434-SPP.4110.123.2026

Pan
Rahul Przykład
ul. Lipowa 5 m. 12
00-123 Warszawa
PESEL: 92031512345

DECYZJA
określająca wysokość zobowiązania podatkowego

Na podstawie art. 21 § 3 oraz art. 207 ustawy – Ordynacja podatkowa, po przeprowadzeniu postępowania podatkowego, Naczelnik Urzędu Skarbowego Warszawa-Mokotów określa Panu wysokość zobowiązania podatkowego w podatku od czynności cywilnoprawnych (PCC) z tytułu umowy sprzedaży samochodu osobowego z dnia ${d(contract)} r. w kwocie 1 234,00 zł.

Uzasadnienie
Kupił Pan używany samochód osobowy. Od takiej umowy należy złożyć deklarację PCC-3 i zapłacić podatek w wysokości 2% wartości rynkowej samochodu. Nie złożył Pan deklaracji i nie zapłacił podatku. W toku postępowania organ ustalił wartość rynkową samochodu na podstawie opinii biegłego.

Kwota do zapłaty: 1 234,00 zł
Wpłaty należy dokonać do dnia ${d(due)} r., wraz z odsetkami za zwłokę, na rachunek:
Odbiorca: Urząd Skarbowy Warszawa-Mokotów
Numer rachunku: PL61 1090 1014 0000 0712 1981 2874
Tytułem: 1434-SPP.4110.123.2026 PCC

Pouczenie
Od niniejszej decyzji służy Panu odwołanie do Dyrektora Izby Administracji Skarbowej w Warszawie, za pośrednictwem Naczelnika Urzędu Skarbowego Warszawa-Mokotów, w terminie 14 dni od dnia doręczenia decyzji. Odwołanie powinno zawierać zarzuty przeciw decyzji, określać istotę i zakres żądania oraz wskazywać dowody.

Z upoważnienia Naczelnika
Anna Nowak
Kierownik Działu Postępowań Podatkowych`;
      },
    },
    {
      id: 'pobyt',
      title: 'Voivodeship office',
      subtitle: 'Appointment about your residence permit',
      build(today) {
        const letter = lastWorkday(addDays(today, -5));
        const applied = addDays(today, -60);
        const appointment = nextWorkday(addDays(today, 8));
        return `WOJEWODA MAZOWIECKI
Mazowiecki Urząd Wojewódzki w Warszawie
Wydział Spraw Cudzoziemców
ul. Przykładowa 1
00-950 Warszawa

Warszawa, dnia ${d(letter)} r.

Znak sprawy: WSC-II-P.6151.12345.2026

Pan
Rahul Przykład
ul. Lipowa 5 m. 12
00-123 Warszawa

WEZWANIE

Na podstawie art. 50 § 1 Kodeksu postępowania administracyjnego, w sprawie z Pana wniosku z dnia ${d(applied)} r. o udzielenie zezwolenia na pobyt czasowy i pracę, wzywam Pana do osobistego stawiennictwa w dniu ${d(appointment)} r. o godz. 9:30 w siedzibie Wydziału Spraw Cudzoziemców, sala 12, w celu złożenia odcisków linii papilarnych.

Proszę zabrać ze sobą:
- to wezwanie,
- ważny paszport,
- 1 aktualną fotografię.

Jeżeli nie stawi się Pan osobiście w wyznaczonym terminie, wniosek zostanie pozostawiony bez rozpoznania.

Jeśli nie może Pan przyjść w tym dniu, prosimy o kontakt przed wyznaczonym terminem.

Z up. Wojewody Mazowieckiego
Jan Kowalski
Inspektor Wojewódzki`;
      },
    },
  ],
};
