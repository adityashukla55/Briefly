import { addDays, formatLocalDate, fromIso } from '../dates.js';

const MANEDER = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
const DAGE = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

const danishDate = (iso) => formatLocalDate(iso, '.', 'dmy');

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${DAGE[fromIso(iso).getUTCDay()]} den ${day}. ${MANEDER[month - 1]} ${year}`;
}

function letterOf(result) {
  return result.letterDate ? `af ${danishDate(result.letterDate)}` : 'af [DD.MM.ÅÅÅÅ]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('da-DK', { style: 'currency', currency: money.currency ?? 'DKK' }).format(money.amount) : '[beløb]';
}

export default {
  id: 'dk',
  slug: 'denmark',
  name: 'Denmark',
  adjective: 'Danish',
  flag: '🇩🇰',
  language: 'da',
  locale: 'da-DK',
  currency: 'DKK',
  decimal: ',',
  thousands: '.',
  dateSeparator: '.',
  dateOrder: 'dmy',
  ibanLength: 18,
  intro: 'Most Danish offices send letters to your Digital Post (in the Digital Post app, borger.dk or e-Boks) instead of by paper, so check it often. Many deadlines, for example 4 weeks to complain, count from the day you received the decision.',
  signals: [
    /\bDanmark\b/i,
    /\.dk\b/i,
    /\bDK\d{2}\s?\d{4}/,
    /\bCPR(?:-?n(?:umme)?r\.?)?\b|\b\d{6}-\d{4}\b/,
    /Skattestyrelsen|Gældsstyrelsen|Udbetaling Danmark|Udlændingestyrelsen|\bSIRI\b|Ankestyrelsen|Familieretshuset/i,
    /\bDigital Post\b|\be-Boks\b|\bMitID\b|\bborger\.dk\b/i,
    /\+71\s?<|\+73\s?<|\+75\s?<|\bFI-kort\b|\bindbetalingskort\b/i,
    /\bkommune\b|\bjobcenter\b/i,
    /\bkr\.\s?\d|\d\s?kr\./,
    /\bmed venlig hilsen\b/i,
  ],
  deliveryDays: 2,
  deliveryNote: 'In Denmark, a letter in Digital Post usually counts as received when it arrives in your mailbox. Paper letters take a few days. Briefly adds about 2 days — check the date in Digital Post or on the envelope.',
  objectionAdvice: 'Use this if you think the decision is wrong. Most Danish offices let you complain (klage) online with MitID, and the complaint usually goes first to the office that made the decision. Send it before the deadline — often 4 weeks.',
  objectionDefault: 'klage',
  deadlineWords: ['senest', 'inden', 'frist'],
  objection: [
    { word: 'klage', pattern: /\bklage/i },
    { word: 'indsigelse', pattern: /indsigelse/i },
    { word: 'anke', pattern: /\banke\b|\banket\b/i },
  ],
  help: {
    debt: 'free debt advice, for example from your kommune, Den Sociale Retshjælp or a debt counselling service (gældsrådgivning)',
    tenant: 'a tenants’ association (Lejernes LO) or the rent board (huslejenævnet)',
    instalments: 'afdragsordning',
    general: 'Den Sociale Retshjælp, a free legal aid office (retshjælp), or Borgerservice in your kommune',
  },
  localAccount(text) {
    const fi = text.match(/\+\s?(71|73|75)\s?<\s?(\d{15,16})\s?\+\s?(\d{8})\s?</);
    if (fi) return { text: `FI card +${fi[1]}<${fi[2]} +${fi[3]}<`, rows: [['FI card type (kortart)', `+${fi[1]}`], ['Payment ID (betalings-id)', fi[2]], ['Creditor number (kreditornummer)', `+${fi[3]}`]] };
    const bank = text.match(/\breg\.?\s?(?:nr\.?|nummer)\s*:?\s*(\d{4})\s*[,/]?\s*(?:konto(?:nummer|nr\.?)?)\s*:?\s*(\d{6,10})\b/i);
    if (bank) return { text: `reg. no. ${bank[1]}, account ${bank[2]}`, rows: [['Reg. no. (reg.nr.)', bank[1]], ['Account (kontonr.)', bank[2]]] };
    return null;
  },
  senders: [
    {
      id: 'skattestyrelsen',
      slug: 'skattestyrelsen',
      name: 'Tax office',
      local: 'Skattestyrelsen (Skat)',
      about: 'The Danish tax office. It sends your yearly tax statement and handles tax on your income, car and home.',
      patterns: [/Skattestyrelsen/i, /\bSKAT\b|skat\.dk/i, /årsopgørelse/i, /forskudsopgørelse/i, /restskat/i, /overskydende skat/i, /\bTastSelv\b/i, /ejendomsværdiskat|grundskyld/i],
      letters: ['Årsopgørelse — your yearly tax statement: money back or tax to pay (restskat)', 'Forskudsopgørelse — your expected income and tax for next year', 'Brev om restskat — tax you still owe and how to pay'],
      tips: ['Check your årsopgørelse in TastSelv on skat.dk. If something is wrong, you can usually change it yourself online.', 'A small restskat paid before 1 July costs less interest than paying it later.'],
    },
    {
      id: 'gaeldsstyrelsen',
      slug: 'gaeldsstyrelsen',
      name: 'Public debt collection agency',
      local: 'Gældsstyrelsen',
      about: 'Collects debts you owe to public bodies, for example unpaid tax, fines, child support or fees.',
      patterns: [/Gældsstyrelsen/i, /lønindeholdelse/i, /modregning/i, /\bgæld til det offentlige\b/i, /afdragsordning/i, /udpantning/i],
      letters: ['Brev om gæld — what you owe to public bodies', 'Varsel om lønindeholdelse — part of your salary will be taken', 'Modregning — a refund was used to pay your debt'],
      tips: ['Ask for an afdragsordning (payment plan) if you can’t pay — it can lower or stop lønindeholdelse.', 'You can see your public debts on gaeldst.dk with MitID.'],
    },
    {
      id: 'udbetaling-danmark',
      slug: 'udbetaling-danmark',
      name: 'Benefits office',
      local: 'Udbetaling Danmark',
      about: 'Pays many benefits, for example child benefit (børne- og ungeydelse), housing benefit (boligstøtte), state pension and maternity benefit.',
      patterns: [/Udbetaling Danmark/i, /børne- og ungeydelse|børnecheck/i, /boligstøtte|boligydelse|boligsikring/i, /folkepension/i, /barselsdagpenge/i, /\bATP\b/],
      letters: ['Afgørelse — what you get, or why a payment changes', 'Krav om tilbagebetaling — they say you got too much', 'Anmodning om oplysninger — they need information'],
      tips: ['If you disagree, you can usually complain within 4 weeks. The complaint goes first to Udbetaling Danmark, then to Ankestyrelsen.', 'Report changes quickly, for example a new income or address — late reports often lead to repayment claims.'],
    },
    {
      id: 'kommune',
      slug: 'kommune',
      name: 'Municipality',
      local: 'Kommunen (Borgerservice)',
      about: 'Your local municipality. It handles cash benefits (kontanthjælp), childcare, schools, local taxes and many social services.',
      patterns: [/\bkommune(?:n)?\b/i, /Borgerservice/i, /kontanthjælp/i, /integrationsydelse|selvforsørgelses- og hjemrejseydelse/i, /daginstitution|dagpleje/i, /forældrebetaling/i],
      letters: ['Afgørelse om kontanthjælp — whether you get cash benefit', 'Opkrævning — a bill, for example for childcare', 'Partshøring — they plan a decision and ask for your side first'],
      tips: ['You can usually complain about a kommune decision within 4 weeks. Send it to the kommune first.'],
    },
    {
      id: 'jobcenter',
      slug: 'jobcenter',
      name: 'Job centre',
      local: 'Jobcenter',
      about: 'The local job centre. It supports your job search and holds meetings if you get unemployment or cash benefits.',
      patterns: [/\bjobcenter\b/i, /jobsamtale/i, /jobnet/i, /min plan/i, /rådighed/i, /\bsanktion/i],
      letters: ['Indkaldelse til jobsamtale — a meeting at the job centre', 'Partshøring om sanktion — they think you broke a rule and ask for your side', 'Afgørelse om sanktion — your benefit is cut'],
      tips: ['Go to every meeting and book them on Jobnet. If you are ill, tell the job centre before the meeting.'],
    },
    {
      id: 'akasse',
      slug: 'a-kasse',
      name: 'Unemployment fund',
      local: 'A-kasse',
      about: 'The unemployment insurance fund that pays unemployment benefit (dagpenge).',
      patterns: [/\ba-kasse(?:n)?\b/i, /arbejdsløshedskasse/i, /dagpenge/i, /\bdagpengeret\b/i],
      letters: ['Afgørelse om dagpenge — whether you get benefit and how much', 'Krav om tilbagebetaling — dagpenge paid too much'],
      tips: ['You can complain about the a-kasse’s decision within 4 weeks. The complaint goes to the a-kasse first.'],
    },
    {
      id: 'siri',
      slug: 'udlaendingemyndigheder',
      name: 'Immigration offices',
      local: 'SIRI / Udlændingestyrelsen',
      about: 'Decide on residence and work permits (SIRI) and on family reunification, asylum and other residence (Udlændingestyrelsen).',
      patterns: [/\bSIRI\b|Styrelsen for International Rekruttering/i, /Udlændingestyrelsen/i, /opholdstilladelse/i, /opholdskort/i, /Udlændingenævnet/i, /biometri/i, /\bnyidanmark\b/i],
      letters: ['Bestilling af biometri — an appointment for photo and fingerprints', 'Afgørelse — your permit was granted or refused', 'Anmodning om oplysninger — they need more documents'],
      tips: ['Deadlines to complain about immigration decisions are short and differ by case. Get advice quickly.', 'Apply to extend your permit before it ends.'],
    },
    {
      id: 'politi',
      slug: 'politi',
      name: 'Police',
      local: 'Politiet',
      about: 'Sends fines (bødeforelæg), for example for speeding caught by a speed camera.',
      patterns: [/\bPolitiet\b|\bpoliti(?:kreds)?\b/i, /bødeforelæg/i, /fartbøde|hastighedsovertrædelse/i, /\bfotovogn\b|\bATK\b/i, /\bbøde\b/i, /vedtagelse/i],
      letters: ['Bødeforelæg — a fine you can accept (vedtage) and pay, or refuse so the case goes to court', 'Brev om førerretsfrakendelse — you may lose your driving licence'],
      tips: ['If you weren’t the driver, tell the police who was. If you don’t accept a fine, the case can go to court.'],
    },
    {
      id: 'domstol',
      slug: 'domstol',
      name: 'Court',
      local: 'Byret / Fogedretten',
      about: 'A court. The city court (byret) handles civil and criminal cases; the bailiff’s court (fogedretten) handles enforcement of debts and evictions.',
      patterns: [/\bbyret\b/i, /fogedretten/i, /betalingspåkrav/i, /indkaldelse til (?:retsmøde|fogedretten)/i, /stævning/i, /\bdom\b/i, /udlæg/i, /udsættelse af lejer/i],
      letters: ['Betalingspåkrav — someone says you owe money; object within 14 days or it can be enforced', 'Indkaldelse til fogedretten — a meeting about seizure (udlæg) for a debt', 'Stævning — someone is taking you to court'],
      tips: ['Always go to a meeting in the fogedretten — if you don’t, the police can bring you there.', 'If you disagree with a betalingspåkrav, object (gør indsigelse) to the court within 14 days.'],
    },
    {
      id: 'inkasso',
      slug: 'inkassobureau',
      name: 'Debt collector',
      local: 'Inkassobureau',
      about: 'A company that collects unpaid bills for others. Fees for reminders and collection are limited by law.',
      patterns: [/inkasso/i, /rykker/i, /\bkreditor\b/i, /\bskyldner\b/i, /\bgæld\b/i, /inkassogebyr|rykkergebyr/i],
      letters: ['Rykker — a reminder with a fee', 'Inkassomeddelelse — pay within at least 10 days or collection costs are added', 'Forslag om afdragsordning — an offer to pay in parts'],
      tips: ['If the claim is wrong, object in writing right away. If you agree, ask for a payment plan you can afford.'],
    },
    {
      id: 'udlejer',
      slug: 'udlejer',
      name: 'Landlord',
      local: 'Udlejer',
      about: 'The owner of your rented home, or the company that manages it.',
      patterns: [/\budlejer\b/i, /\blejer\b/i, /lejekontrakt|lejeaftale/i, /\bhusleje\b/i, /opsigelse/i, /huslejestigning|lejeforhøjelse/i, /depositum/i, /huslejenævn/i],
      letters: ['Opsigelse — your landlord ends your contract', 'Varsel om lejeforhøjelse — your rent goes up', 'Påkrav — unpaid rent; pay within the deadline or you can lose your home'],
      tips: ['A påkrav for unpaid rent is serious — pay within the deadline (often 14 days) or contact your landlord and kommune right away.', 'You can often object to a rent increase within 6 weeks. Ask a tenants’ association.'],
    },
    {
      id: 'forsyning',
      slug: 'forsyning',
      name: 'Energy and water supplier',
      local: 'El-, varme- og vandforsyning',
      about: 'The companies that supply electricity, district heating and water.',
      patterns: [/\belselskab\b|\bel-?regning\b/i, /fjernvarme|varmeværk/i, /vandværk|forsyning/i, /\bkWh\b/i, /\baconto\b/i, /årsopgørelse for (?:el|varme|vand)/i, /afbrydelse|lukning/i],
      letters: ['Årsopgørelse / slutafregning — your yearly bill', 'Aconto-regning — your advance payment', 'Varsel om lukning — unpaid bills; they plan to cut the supply'],
      tips: ['Call before the cut-off date and ask for a payment plan. Your kommune may help in an emergency.'],
    },
    {
      id: 'region',
      slug: 'region-sundhed',
      name: 'Health care',
      local: 'Regionen (sundhed)',
      about: 'The regions run hospitals and send appointments for examinations and treatment.',
      patterns: [/\bregion(?:en)?\b/i, /\bhospital\b|sygehus/i, /indkaldelse til (?:undersøgelse|behandling|ambulant)/i, /\bambulatorium\b/i, /sundhed\.dk/i],
      letters: ['Indkaldelse — date and time of a hospital appointment'],
      tips: ['If you can’t come, cancel the appointment so someone else can have it.'],
    },
    {
      id: 'su',
      slug: 'su',
      name: 'Student grants office',
      local: 'SU (Uddannelses- og Forskningsstyrelsen)',
      about: 'Pays student grants and loans (SU) and collects repayment if you got too much.',
      patterns: [/\bSU\b/, /Statens Uddannelsesstøtte/i, /Uddannelses- og Forskningsstyrelsen/i, /\bSU-lån\b/i, /fribeløb/i],
      letters: ['Krav om tilbagebetaling — you earned too much (over your fribeløb) and must pay SU back', 'Brev om SU-lån — your loan and repayment'],
      tips: ['If you earned too much, you can often pay back part of the SU before the deadline to avoid a bigger claim.'],
    },
  ],
  kinds: [
    {
      id: 'udlaeg', type: 'enforcement', local: 'Lønindeholdelse / Udlæg', name: 'Seizure for a debt', about: 'Part of your salary or benefits will be taken, or your belongings can be seized (udlæg), to pay a debt.', urgency: 'high', objection: false, patterns: [/lønindeholdelse/i, /\budlæg\b/i, /fogedretten/i, /tvangsauktion/i, /udpantning/i],
      steps: ['Contact the office today and ask for a payment plan (afdragsordning) — it can lower or stop the seizure.', 'Get free debt advice, for example from Den Sociale Retshjælp or your kommune.'],
    },
    {
      id: 'betalingspaakrav', type: 'court-order', local: 'Betalingspåkrav', name: 'Payment order from the court', about: 'Someone asked the court to make you pay. If you don’t object within 14 days, it can be enforced like a judgment.', urgency: 'high', objection: false, extendable: false, patterns: [/betalingspåkrav/i, /indsigelse til (?:retten|skifteretten|byretten)/i],
      steps: ['If you disagree, object (gør indsigelse) to the court within 14 days — often online at minretssag.dk.', 'If you agree, pay or contact the creditor right away to avoid enforcement.'],
    },
    {
      id: 'staevning', type: 'court-order', local: 'Stævning / Indkaldelse til retsmøde', name: 'Court case', about: 'Someone is taking you to court, or you are called to a court hearing.', urgency: 'high', objection: false, extendable: false, patterns: [/stævning/i, /indkaldelse til retsmøde/i, /svarskrift/i, /\bretsmøde\b/i],
      steps: ['Answer the court or go to the hearing by the date given. If you don’t, the court can decide without you.'],
    },
    {
      id: 'rykker', type: 'reminder', local: 'Rykker / Inkassomeddelelse', name: 'Payment reminder', about: 'A payment is late. Reminder fees and collection costs can be added.', urgency: 'high', patterns: [/rykker/i, /inkassomeddelelse/i, /påmindelse/i, /ikke (?:er )?betalt/i, /forfalden/i, /restance/i],
    },
    {
      id: 'paakrav', type: 'reminder', local: 'Påkrav', name: 'Final demand for rent', about: 'Your landlord demands unpaid rent. If you don’t pay within the deadline, you can lose your home.', urgency: 'high', patterns: [/\bpåkrav\b/i, /ophævelse af lejemålet/i, /skyldig husleje/i],
      steps: ['Pay within the deadline in the letter, or contact your landlord and your kommune today. Ask a tenants’ association for help.'],
    },
    {
      id: 'tilbagebetaling', type: 'repayment', local: 'Krav om tilbagebetaling', name: 'Request to pay money back', about: 'They say you got too much money, for example housing benefit, child benefit or SU, and want it back.', urgency: 'high', patterns: [/tilbagebetal/i, /betale[^\n]{0,30}tilbage/i, /for meget udbetalt|fået for meget/i, /uberettiget modtaget/i],
      steps: ['If you think it’s wrong, complain within the deadline in the letter (often 4 weeks).', 'If you can’t pay at once, ask for an afdragsordning.'],
    },
    {
      id: 'boede', type: 'fine', local: 'Bødeforelæg', name: 'Fine', about: 'A fine, for example for speeding. You can accept it and pay, or refuse — then the case can go to court.', urgency: 'high', objection: false, patterns: [/bødeforelæg/i, /\bbøde\b/i, /vedtagelse/i, /fartbøde|hastighedsovertrædelse/i, /parkeringsafgift|kontrolafgift/i],
      steps: ['To accept the fine, sign and pay by the date in the letter. If you don’t accept it, tell the police — the case can then go to court.', 'If you weren’t driving, tell the police who was.'],
    },
    {
      id: 'aarsopgoerelse', type: 'tax-assessment', local: 'Årsopgørelse / Restskat', name: 'Yearly tax statement', about: 'Your tax for the year. It shows if you get money back (overskydende skat) or must pay (restskat).', urgency: 'medium', patterns: [/årsopgørelse/i, /restskat/i, /overskydende skat/i, /indkomstår/i, /skatteansættelse/i],
      steps: ['Check the figures in TastSelv on skat.dk. If something is wrong, you can often correct it yourself, or complain within 3 months.', 'Restskat can be paid at once, or added to next year’s tax with interest.'],
    },
    {
      id: 'partshoering', type: 'hearing', local: 'Partshøring', name: 'Chance to give your side', about: 'They plan a decision that affects you and invite you to comment first. Your answer can change the decision.', urgency: 'medium', objection: false, patterns: [/partshøring/i, /bemærkninger til sagen/i, /inden vi træffer afgørelse/i, /mulighed for at komme med bemærkninger/i] },
    {
      id: 'afgoerelse', type: 'decision', local: 'Afgørelse', name: 'Decision', about: 'A decision about your benefits, permit or another request — for example what you get, a change or that it stops.', urgency: 'medium', weight: 0.7, patterns: [/afgørelse/i, /vi har besluttet|vi har truffet afgørelse/i, /klagevejledning/i, /\bsanktion/i],
      steps: ['Read the complaint guide (klagevejledning) at the end. It says where to complain and by when — often 4 weeks.'],
    },
    {
      id: 'afslag', type: 'rejection', local: 'Afslag', name: 'Refusal', about: 'Your application was refused. The letter says how and by when you can complain.', urgency: 'medium', patterns: [/\bafslag\b/i, /du kan ikke få/i, /vi har givet (?:dig )?afslag/i, /ikke (?:ret til|bevilget|imødekommet)/i],
      steps: ['If you think it’s wrong, complain within the deadline in the klagevejledning — often 4 weeks.'],
    },
    { id: 'bevilling', type: 'approval', local: 'Bevilling', name: 'Approval', about: 'Your application was approved. Check that the amounts and dates are right.', urgency: 'low', patterns: [/bevilget|bevilling/i, /du har fået (?:tilladelse|ret til)/i, /imødekommet/i, /du får (?:boligstøtte|ydelse|tilskud)/i] },
    {
      id: 'indkaldelse', type: 'appointment', local: 'Indkaldelse', name: 'Appointment', about: 'They want you to come to a meeting or appointment. Missing it can cut your benefits or delay your case.', urgency: 'medium', patterns: [/indkald/i, /\bmøde\b/i, /samtale/i, /mødetid/i, /fremmøde/i, /bestilling af biometri/i],
      steps: ['For the job centre: if you miss a meeting without a good reason, your benefit can be cut. Tell them before if you are ill.'],
    },
    {
      id: 'oplysninger', type: 'documents', local: 'Anmodning om oplysninger', name: 'Request for documents', about: 'They need more information or papers before they can decide.', urgency: 'medium', patterns: [/anmodning om oplysninger/i, /vi mangler oplysninger/i, /send(?:e)? (?:os )?(?:følgende|dokumentation)/i, /indsende dokumentation/i] },
    {
      id: 'opsigelse', type: 'termination', local: 'Opsigelse', name: 'Notice to end a contract', about: 'Someone ends a contract with you — for example your landlord ends your rental contract.', urgency: 'high', objection: false, patterns: [/opsigelse/i, /opsiger/i, /fraflytning/i, /ophævelse/i],
      steps: ['A landlord can only end a contract for reasons in the law. Ask a tenants’ association before you agree to move out — you can often object within 6 weeks.'],
    },
    {
      id: 'forsyningsregning', type: 'utility-bill', local: 'El-, varme- eller vandregning', name: 'Energy or water bill', about: 'A bill for electricity, heating or water.', urgency: 'medium', patterns: [/\bkWh\b/i, /\baconto\b/i, /målerstand/i, /forbrug/i, /slutafregning/i] },
    { id: 'faktura', type: 'bill', local: 'Faktura / Opkrævning', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bfaktura\b/i, /opkrævning/i, /betalingsfrist/i, /sidste rettidige betalingsdag/i, /\bforfaldsdato\b/i] },
  ],
  references: [
    { name: 'Case number', local: 'Sagsnummer', pattern: /(?:\bsagsnummer|\bsagsnr\.?|\bsag\s?nr\.?|\bjournalnummer|\bj\.\s?nr\.?|\bvores reference)/gi },
    { name: 'Invoice number', local: 'Fakturanummer', pattern: /\bfakturanummer|\bfaktura\s?nr\.?/gi },
    { name: 'Customer number', local: 'Kundenummer', pattern: /(?:\bkundenummer|\bkunde\s?nr\.?|\baftalenummer|\bforbrugernummer)/gi },
    { name: 'Fine number', local: 'Bødenummer', pattern: /(?:\bbødenummer|\bbødeforelæg\s?nr\.?|\bsagsnummer hos politiet)/gi },
    { name: 'Vehicle registration', local: 'Registreringsnummer', pattern: /\bregistreringsnummer|\breg\.\s?nummer/gi },
    { name: 'Personal identity number', local: 'CPR-nummer', personal: true, pattern: /\bCPR(?:-?n(?:umme)?r\.?)?/gi },
    { name: 'Payment ID', local: 'Betalings-ID', payment: true, pattern: /(?:\bbetalings-?id|\bbetalingsidentifikation|\bindbetaler-?id)/gi },
  ],
  glossary: [
    { term: 'Digital Post', slug: 'digital-post', pattern: /Digital Post|e-Boks/i, meaning: 'The digital mailbox where Danish offices send letters. Letters there count as received.' },
    { term: 'MitID', slug: 'mitid', pattern: /\bMitID\b/i, meaning: 'Your digital ID for logging in to public and bank websites.' },
    { term: 'CPR-nummer', slug: 'cpr-nummer', pattern: /\bCPR/i, meaning: 'Your personal identity number, like 300785-1234.' },
    { term: 'Skattestyrelsen', slug: 'skattestyrelsen', pattern: /Skattestyrelsen|\bSKAT\b/i, meaning: 'The Danish tax office.' },
    { term: 'årsopgørelse', slug: 'aarsopgoerelse', pattern: /årsopgørelse/i, meaning: 'Your yearly tax statement: money back or tax to pay.' },
    { term: 'forskudsopgørelse', slug: 'forskudsopgoerelse', pattern: /forskudsopgørelse/i, meaning: 'Your expected income and tax for the coming year. Keep it up to date to avoid restskat.' },
    { term: 'restskat', slug: 'restskat', pattern: /restskat/i, meaning: 'Tax you still have to pay for the year.', tip: 'Paying it before 1 July costs less interest.' },
    { term: 'overskydende skat', slug: 'overskydende-skat', pattern: /overskydende skat/i, meaning: 'Tax you paid too much. You get it back.' },
    { term: 'TastSelv', slug: 'tastselv', pattern: /TastSelv/i, meaning: 'The self-service part of skat.dk where you see and change your tax.' },
    { term: 'Gældsstyrelsen', slug: 'gaeldsstyrelsen-ord', pattern: /Gældsstyrelsen/i, meaning: 'The agency that collects debts to public bodies.' },
    { term: 'lønindeholdelse', slug: 'loenindeholdelse', pattern: /lønindeholdelse/i, meaning: 'Part of your salary is taken to pay a public debt.' },
    { term: 'modregning', slug: 'modregning', pattern: /modregning/i, meaning: 'Money you should get, for example a tax refund, is used to pay a debt.' },
    { term: 'afdragsordning', slug: 'afdragsordning', pattern: /afdragsordning/i, meaning: 'A plan to pay a debt in monthly parts.' },
    { term: 'betalingsfrist', slug: 'betalingsfrist', pattern: /betalingsfrist|sidste rettidige betalingsdag/i, meaning: 'The last day to pay.' },
    { term: 'FI-kort', slug: 'fi-kort', pattern: /\bFI-kort\b|indbetalingskort|\+7[135]\s?</i, meaning: 'A payment code like +71<123456789012345 +12345678<. You type it in your online bank to pay.', tip: 'Copy all three parts exactly, so the payment is linked to you.' },
    { term: 'Udbetaling Danmark', slug: 'udbetaling-danmark-ord', pattern: /Udbetaling Danmark/i, meaning: 'The office that pays many benefits, like child benefit, housing benefit and pension.' },
    { term: 'boligstøtte', slug: 'boligstoette', pattern: /boligstøtte|boligydelse|boligsikring/i, meaning: 'Housing benefit to help pay rent.' },
    { term: 'børne- og ungeydelse', slug: 'boerne-og-ungeydelse', pattern: /børne- og ungeydelse|børnecheck/i, meaning: 'Child benefit, paid four times a year.' },
    { term: 'kontanthjælp', slug: 'kontanthjaelp', pattern: /kontanthjælp/i, meaning: 'Cash benefit from the kommune for people who can’t support themselves.' },
    { term: 'dagpenge', slug: 'dagpenge', pattern: /dagpenge/i, meaning: 'Unemployment benefit from your a-kasse.' },
    { term: 'a-kasse', slug: 'a-kasse-ord', pattern: /\ba-kasse/i, meaning: 'Unemployment insurance fund.' },
    { term: 'jobsamtale', slug: 'jobsamtale', pattern: /jobsamtale/i, meaning: 'A meeting at the job centre about your job search.' },
    { term: 'sanktion', slug: 'sanktion', pattern: /\bsanktion/i, meaning: 'A cut in your benefit, for example after a missed meeting.' },
    { term: 'afgørelse', slug: 'afgoerelse', pattern: /afgørelse/i, meaning: 'An official decision.' },
    { term: 'klage', slug: 'klage', pattern: /\bklage/i, meaning: 'A complaint against a decision.', tip: 'Often within 4 weeks. Send it to the office that made the decision.' },
    { term: 'klagevejledning', slug: 'klagevejledning', pattern: /klagevejledning/i, meaning: 'The part of a decision that tells you how, where and by when to complain.' },
    { term: 'Ankestyrelsen', slug: 'ankestyrelsen', pattern: /Ankestyrelsen/i, meaning: 'The national appeals board for many social decisions.' },
    { term: 'partshøring', slug: 'partshoering', pattern: /partshøring/i, meaning: 'Your chance to give your side before a decision is made.', tip: 'Answer within the deadline. Your comments can change the decision.' },
    { term: 'aktindsigt', slug: 'aktindsigt', pattern: /aktindsigt/i, meaning: 'Your right to see the documents in your case.' },
    { term: 'opholdstilladelse', slug: 'opholdstilladelse', pattern: /opholdstilladelse/i, meaning: 'Residence permit.' },
    { term: 'biometri', slug: 'biometri', pattern: /biometri/i, meaning: 'Your photo and fingerprints, taken for a residence card.' },
    { term: 'bødeforelæg', slug: 'boedeforelaeg', pattern: /bødeforelæg/i, meaning: 'A fine notice. You can accept it and pay, or refuse so the case goes to court.' },
    { term: 'betalingspåkrav', slug: 'betalingspaakrav', pattern: /betalingspåkrav/i, meaning: 'A payment order from the court. You have 14 days to object.' },
    { term: 'fogedretten', slug: 'fogedretten', pattern: /fogedretten/i, meaning: 'The bailiff’s court. It handles seizure for debts and evictions.' },
    { term: 'udlæg', slug: 'udlaeg', pattern: /\budlæg\b/i, meaning: 'Seizure of belongings or money for a debt.' },
    { term: 'rykker', slug: 'rykker', pattern: /rykker/i, meaning: 'A payment reminder, often with a fee.' },
    { term: 'inkasso', slug: 'inkasso', pattern: /inkasso/i, meaning: 'Debt collection.' },
    { term: 'påkrav', slug: 'paakrav', pattern: /\bpåkrav\b/i, meaning: 'A formal demand to pay unpaid rent. If you don’t pay in time, you can lose your home.' },
    { term: 'opsigelse', slug: 'opsigelse', pattern: /opsigelse/i, meaning: 'Notice that a contract will end.' },
    { term: 'depositum', slug: 'depositum', pattern: /depositum/i, meaning: 'Deposit you paid when you moved in.' },
  ],
  extraReplies: [
    {
      id: 'indsigelse',
      title: 'Object to the claim (indsigelse)',
      advice: 'Use this if you don’t agree that you owe the money. Send it right away, in writing, and keep a copy. For a betalingspåkrav, send the objection to the court within 14 days.',
      english: 'I object to the claim. Reason: [your reason]. I do not owe this money. Please send me proof of the claim.',
      subject: 'Vedr.: Indsigelse mod krav',
      body: (result) => [
        `Jeg gør hermed indsigelse mod kravet i jeres brev ${letterOf(result)} på ${amountOf(result)}.`,
        '',
        'Begrundelse: [Forklar hvorfor du ikke skylder pengene, for eksempel: jeg har allerede betalt / jeg har aldrig bestilt varen.]',
        '',
        'Jeg beder jer sende dokumentation for kravet og stille inddrivelsen i bero, indtil I har svaret.',
      ],
      when: (result) => ['inkasso'].includes(result.sender?.id) || ['rykker', 'betalingspaakrav'].includes(result.kind?.id),
      replaces: 'objection',
    },
    {
      id: 'partshoering-svar',
      title: 'Give your side (partshøring)',
      advice: 'Use this to comment before they make the decision. Send it before the deadline in the letter, for example through Digital Post.',
      english: 'About your letter, I want to give my side: [your explanation]. I ask you to take this into account.',
      subject: 'Vedr.: Bemærkninger til partshøring',
      body: (result) => [
        `Jeg har modtaget jeres partshøring ${letterOf(result)} og har følgende bemærkninger:`,
        '',
        '[Forklar din situation og hvorfor den planlagte afgørelse ikke er rigtig.]',
        '',
        '[Jeg vedlægger dokumentation.]',
        '',
        'Jeg beder jer tage mine bemærkninger med i afgørelsen.',
      ],
      when: (result) => result.kind?.id === 'partshoering',
    },
  ],
  samples: [
    {
      id: 'udbetaling-danmark',
      title: 'Udbetaling Danmark',
      subtitle: 'Claim to pay back housing benefit',
      build(today) {
        const letter = addDays(today, -3);
        const due = addDays(letter, 30);
        return `Udbetaling Danmark
Kongens Vænge 8
3400 Hillerød

Dato: ${danishDate(letter)}
Sagsnummer: 2026-123456
CPR-nummer: 300785-1234

Mette Eksempel
Eksempelvej 12, 2. th.
2300 København S

Krav om tilbagebetaling af boligstøtte

Kære Mette Eksempel

Vi har truffet afgørelse om, at du skal betale 3.245,00 kr. tilbage, fordi du har fået for meget boligstøtte i perioden 01.01.2026 til 30.06.2026. Din indkomst var højere end oplyst.

Beløbet skal være betalt senest den ${danishDate(due)}.
Du kan betale med indbetalingskort: +71<123456789012345 +87654321<

Hvis du ikke kan betale hele beløbet på én gang, kan du søge om en afdragsordning.

Klagevejledning
Hvis du vil klage over afgørelsen, skal du gøre det inden 4 uger fra du har modtaget afgørelsen. Klagen sendes til Udbetaling Danmark.

Med venlig hilsen
Udbetaling Danmark`;
      },
    },
    {
      id: 'jobcenter',
      title: 'Jobcenter',
      subtitle: 'Meeting at the job centre',
      build(today) {
        const letter = addDays(today, -2);
        const meeting = nextWorkday(addDays(today, 8));
        return `Jobcenter København
Eksempelgade 10
2100 København Ø

Dato: ${danishDate(letter)}
Sagsnummer: JC-2026-98765

Ahmed Eksempel
Prøvevej 4, st. tv.
2200 København N

Indkaldelse til jobsamtale

Kære Ahmed Eksempel

Du er indkaldt til jobsamtale i Jobcenter København, Eksempelgade 10, ${longDate(meeting)} kl. 9.30.

Til samtalen skal vi tale om dit jobsøgning og din plan.

Hvis du er syg eller ikke kan komme, skal du give besked til jobcentret inden mødet. Hvis du udebliver uden rimelig grund, kan det betyde, at din ydelse bliver nedsat.

Med venlig hilsen
Jobcenter København`;
      },
    },
  ],
};
