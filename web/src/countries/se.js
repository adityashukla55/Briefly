import { addDays, formatLocalDate, fromIso } from '../dates.js';

const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

const swedishDate = (iso) => formatLocalDate(iso, '-', 'ymd');

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MANADER[month - 1]} ${year}`;
}

function letterOf(result) {
  return result.letterDate ? `daterat ${swedishDate(result.letterDate)}` : 'daterat [ÅÅÅÅ-MM-DD]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: money.currency ?? 'SEK' }).format(money.amount) : '[belopp]';
}

export default {
  id: 'se',
  slug: 'sweden',
  name: 'Sweden',
  adjective: 'Swedish',
  flag: '🇸🇪',
  language: 'sv',
  locale: 'sv-SE',
  currency: 'SEK',
  decimal: ',',
  thousands: ' ',
  dateSeparator: '-',
  dateOrder: 'ymd',
  ibanLength: 24,
  intro: 'Swedish offices often send letters to your digital mailbox (for example Kivra or Min myndighetspost) as well as by post. Many deadlines count from the day you “got part of” the decision (fick del av beslutet), so note the day the letter arrived.',
  signals: [
    /\bSverige\b/i,
    /\.se\b/i,
    /\bSE\d{2}\s?\d{4}/,
    /\b\d{3}\s\d{2}\s+\p{Lu}/u,
    /\bpersonnummer\b|\b(?:19|20)?\d{6}[-+]\d{4}\b/i,
    /Skatteverket|Försäkringskassan|Kronofogden|Arbetsförmedlingen|Migrationsverket|Transportstyrelsen|Pensionsmyndigheten/i,
    /\bbankgiro\b|\bplusgiro\b|\bOCR-?nummer\b/i,
    /\bkommun(?:en)?\b|\bförvaltningsrätt/i,
    /\bkronor\b|\bkr\b/,
    /\bmed vänliga hälsningar\b/i,
  ],
  deliveryDays: 2,
  deliveryNote: 'In Sweden, deadlines to appeal usually start on the day you received the decision (fick del av beslutet). If the office used simplified delivery (förenklad delgivning), the letter counts as received two weeks after it was sent. Briefly adds about 2 days for post — check when your letter really arrived.',
  objectionAdvice: 'Use this if you think the decision is wrong. Many Swedish offices let you ask for a new review (omprövning) or appeal (överklagande) online with BankID. Send it before the deadline and write which decision you mean.',
  objectionDefault: 'omprövning',
  deadlineWords: ['senast', 'inom', 'sista dag'],
  objection: [
    { word: 'omprövning', pattern: /omprövning|ompröva/i },
    { word: 'överklagande', pattern: /överklag/i },
    { word: 'bestridande', pattern: /bestrid/i },
  ],
  help: {
    debt: 'free budget and debt advice from your kommun (budget- och skuldrådgivning)',
    tenant: 'Hyresgästföreningen (the tenants’ union) or the rent tribunal (hyresnämnden)',
    instalments: 'avbetalningsplan',
    general: 'your kommun’s help desk, Hallå konsument for consumer issues, or a lawyer’s free first advice (advokatjouren)',
  },
  localAccount(text) {
    const bankgiro = text.match(/\bbankgiro(?:nummer)?\s*:?\s*(\d{3,4}-\d{4})\b/i);
    if (bankgiro) return { text: `bankgiro ${bankgiro[1]}`, rows: [['Bankgiro', bankgiro[1]]] };
    const plusgiro = text.match(/\bplusgiro(?:nummer)?\s*:?\s*(\d{1,7}-\d)\b/i);
    if (plusgiro) return { text: `plusgiro ${plusgiro[1]}`, rows: [['Plusgiro', plusgiro[1]]] };
    return null;
  },
  cancelTips: [
    'Phone and internet: the minimum term can be at most 24 months, and the notice period at most 1 month. After it renews, you can cancel any time with at most 1 month’s notice.',
    'If a contract renews by itself, the company must remind you in writing at least 1 month before your last day to cancel. If it doesn’t, you can cancel at once.',
    'Gyms may have a minimum term of at most 12 months.',
    'Insurance: you can always cancel so it ends at the end of the insurance period. You can only cancel earlier for a good reason, for example if you no longer need it.',
  ],
  cancelRules: [
    {
      since: '2014-05-01',
      notice: '1m',
      text: 'Phone and internet contracts: the notice period can be at most 1 month. After the minimum term, you can cancel any time.',
    },
  ],
  senders: [
    {
      id: 'skatteverket',
      slug: 'skatteverket',
      name: 'Tax office',
      local: 'Skatteverket',
      about: 'The tax office. It handles income tax, your tax account (skattekonto) and the population register (folkbokföring).',
      patterns: [/Skatteverket/i, /slutskattebesked/i, /skattekonto/i, /restskatt/i, /inkomstdeklaration/i, /folkbokföring/i, /preliminärskatt/i, /\bF-skatt\b/i],
      letters: ['Slutskattebesked — your final tax for the year: money back or tax to pay (restskatt)', 'Kontoutdrag skattekonto — a statement of your tax account', 'Beslut om folkbokföring — about where you are registered as living'],
      tips: ['Pay to your tax account with your personal OCR number, so the payment is linked to you.', 'You can ask for a new review (omprövning) of a tax decision for several years — but act quickly if you have to pay.'],
    },
    {
      id: 'forsakringskassan',
      slug: 'forsakringskassan',
      name: 'Social insurance office',
      local: 'Försäkringskassan',
      about: 'Pays social insurance, for example child benefit, parental benefit, sickness benefit and housing allowance.',
      patterns: [/Försäkringskassan/i, /föräldrapenning/i, /barnbidrag/i, /sjukpenning/i, /bostadsbidrag/i, /aktivitetsersättning|sjukersättning/i, /tillfällig föräldrapenning/i],
      letters: ['Beslut — what you get, or why a payment changes or stops', 'Återkrav — they say you got too much and want it back', 'Begäran om komplettering — they need more information'],
      tips: ['If you disagree, ask for omprövning within two months from the day you got the decision.', 'Report changes quickly, for example a new income or address — late reports often lead to återkrav.'],
    },
    {
      id: 'kronofogden',
      slug: 'kronofogden',
      name: 'Enforcement agency',
      local: 'Kronofogden',
      about: 'The Swedish Enforcement Authority. It handles payment orders, collects debts by seizing wages or property, and decides on debt relief (skuldsanering).',
      patterns: [/Kronofogden/i, /betalningsföreläggande/i, /utmätning/i, /löneutmätning/i, /skuldsanering/i, /betalningsanmärkning/i, /\bmålnummer\b/i, /handräckning/i],
      letters: ['Betalningsföreläggande — someone says you owe money; answer by the date or it can be decided against you', 'Beslut om löneutmätning — part of your salary will be taken', 'Utslag — the decision that you must pay'],
      tips: ['If you don’t agree with a payment order, dispute it (bestrid) by the date in the letter — you can do it online.', 'A decision against you usually leads to a payment remark (betalningsanmärkning), which makes it hard to rent or borrow for years.'],
    },
    {
      id: 'arbetsformedlingen',
      slug: 'arbetsformedlingen',
      name: 'Job centre',
      local: 'Arbetsförmedlingen',
      about: 'The public employment service. It supports your job search and checks it if you get unemployment benefit.',
      patterns: [/Arbetsförmedlingen/i, /aktivitetsrapport/i, /handlingsplan/i, /kallelse till (?:möte|samtal)/i, /arbetssökande/i, /etableringsprogram/i],
      letters: ['Kallelse — a meeting with your job counsellor', 'Underrättelse — they think you broke a rule; you can explain before a decision', 'Beslut om varning eller avstängning — your benefit can be cut'],
      tips: ['Send your activity report (aktivitetsrapport) every month on time.', 'If you can’t come to a meeting, tell them before — missing it can lead to a warning.'],
    },
    {
      id: 'akassa',
      slug: 'a-kassa',
      name: 'Unemployment fund',
      local: 'A-kassa',
      about: 'The unemployment insurance fund that pays unemployment benefit (a-kassa).',
      patterns: [/\ba-kassa(?:n)?\b/i, /arbetslöshetskassa/i, /arbetslöshetsersättning/i, /ersättningsperiod/i, /kassakort/i],
      letters: ['Beslut om ersättning — how much you get and for how long', 'Återkrav — benefit paid too much', 'Begäran om uppgifter — they need papers from you'],
      tips: ['You can ask the fund for omprövning if you disagree, then appeal to the administrative court.'],
    },
    {
      id: 'migrationsverket',
      slug: 'migrationsverket',
      name: 'Migration agency',
      local: 'Migrationsverket',
      about: 'Decides on residence permits, work permits and citizenship.',
      patterns: [/Migrationsverket/i, /uppehållstillstånd/i, /arbetstillstånd/i, /medborgarskap/i, /uppehållstillståndskort|\bUT-kort\b/i, /(?<![A-Za-zÀ-ɏ])ärendenummer\b/i],
      letters: ['Kallelse — an appointment for an interview or to give fingerprints and a photo', 'Beslut — your permit was granted or refused', 'Begäran om komplettering — they need more documents'],
      tips: ['To appeal a decision, you usually have only three weeks from the day you got it. Get advice quickly.', 'Keep your contact details up to date in your case.'],
    },
    {
      id: 'kommun',
      slug: 'kommun',
      name: 'Municipality',
      local: 'Kommunen',
      about: 'Your local municipality. It handles social services (ekonomiskt bistånd), schools, childcare fees, building permits and local fees.',
      patterns: [/\bkommun(?:en)?\b/i, /socialtjänst/i, /ekonomiskt bistånd|försörjningsstöd/i, /barnomsorgsavgift|förskoleavgift/i, /bygglov/i, /avfallstaxa|renhållning/i],
      letters: ['Beslut om ekonomiskt bistånd — whether you get social assistance', 'Faktura — for example childcare or waste collection', 'Kallelse — a meeting with a social worker'],
      tips: ['You can appeal a kommun decision to the administrative court, usually within three weeks.'],
    },
    {
      id: 'transportstyrelsen',
      slug: 'transportstyrelsen',
      name: 'Transport agency',
      local: 'Transportstyrelsen',
      about: 'Handles vehicle tax, congestion tax and driving licences.',
      patterns: [/Transportstyrelsen/i, /fordonsskatt/i, /trängselskatt/i, /infrastrukturavgift/i, /körkort/i, /tilläggsavgift/i, /registreringsnummer/i],
      letters: ['Fordonsskatt — yearly vehicle tax', 'Trängselskatt — congestion tax for driving in Stockholm or Gothenburg', 'Betalningspåminnelse med tilläggsavgift — a late payment with an extra fee'],
      tips: ['Pay congestion tax by the date on the bill, otherwise a fee is added.'],
    },
    {
      id: 'polisen',
      slug: 'polisen',
      name: 'Police and prosecutor',
      local: 'Polisen / Åklagarmyndigheten',
      about: 'Sends fines, for example for speeding (ordningsbot), and penalty orders from the prosecutor (strafföreläggande).',
      patterns: [/\bPolisen\b/i, /Åklagarmyndigheten|(?<![A-Za-zÀ-ɏ])åklagare\b/i, /ordningsbot/i, /strafföreläggande/i, /hastighetsöverträdelse|fortkörning/i, /\bböter\b/i, /parkeringsanmärkning|felparkeringsavgift/i],
      letters: ['Ordningsbot — a fixed fine you can accept and pay', 'Strafföreläggande — the prosecutor offers a fine instead of a court case', 'Felparkeringsavgift — a parking fine'],
      tips: ['If you don’t accept a fine, the case can go to court. Get advice if you think it’s wrong.'],
    },
    {
      id: 'domstol',
      slug: 'domstol',
      name: 'Court',
      local: 'Tingsrätt / Förvaltningsrätt',
      about: 'A court. The district court (tingsrätt) handles civil and criminal cases; the administrative court (förvaltningsrätt) handles appeals against offices.',
      patterns: [/tingsrätt/i, /förvaltningsrätt/i, /hovrätt|kammarrätt/i, /stämning/i, /\bkallelse till (?:huvudförhandling|förhandling)/i, /\bmål nr\b|\bmålnummer\b/i, /\bdom\b/i],
      letters: ['Stämning — someone is taking you to court', 'Kallelse till förhandling — a court hearing date', 'Dom — the court’s decision'],
      tips: ['Answer court letters by the date given. If you don’t, the court can decide without you.'],
    },
    {
      id: 'csn',
      slug: 'csn',
      name: 'Student finance office',
      local: 'CSN',
      about: 'Pays student aid and collects student loan repayments.',
      patterns: [/\bCSN\b/, /Centrala studiestödsnämnden/i, /studiemedel/i, /studielån/i, /årsbelopp/i, /återbetalning av studielån/i],
      letters: ['Årsbesked — your yearly repayment and due dates', 'Återkrav — student aid paid too much', 'Påminnelse — a missed repayment'],
      tips: ['If you can’t pay, you can ask CSN for a lower amount (nedsättning) — apply before the due date.'],
    },
    {
      id: 'inkasso',
      slug: 'inkassobolag',
      name: 'Debt collector',
      local: 'Inkassobolag',
      about: 'A company that collects unpaid bills for others. It must give you at least 8 days to pay or dispute.',
      patterns: [/inkasso/i, /inkassokrav/i, /\bborgenär\b/i, /\bfordran\b/i, /\bgäldenär\b/i, /påminnelseavgift/i],
      letters: ['Inkassokrav — pay or dispute within the time given, usually at least 8 days', 'Avbetalningsförslag — an offer to pay in parts', 'Underrättelse om ansökan hos Kronofogden — they plan to go to Kronofogden'],
      tips: ['If you think the claim is wrong, dispute it in writing (bestrid) — then they must go to court instead of Kronofogden.', 'Extra fees for reminders and collection are limited by law.'],
    },
    {
      id: 'hyresvard',
      slug: 'hyresvard',
      name: 'Landlord',
      local: 'Hyresvärd',
      about: 'The owner of your rented home, or the company that manages it.',
      patterns: [/hyresvärd/i, /hyresgäst/i, /hyresavtal|hyreskontrakt/i, /\bhyra\b|\bhyran\b/i, /uppsägning/i, /hyreshöjning|ny hyra/i, /hyresnämnd/i],
      letters: ['Uppsägning — your landlord ends your contract', 'Hyreshöjning — your rent goes up', 'Påminnelse om hyra — rent is late'],
      tips: ['Unpaid rent can quickly lead to losing your home. Pay or contact your landlord and social services right away.', 'Ask Hyresgästföreningen before you accept a notice or a big rent increase.'],
    },
    {
      id: 'energi',
      slug: 'elbolag',
      name: 'Electricity company',
      local: 'Elbolag / Elnätsbolag',
      about: 'The company that sells you electricity, or the one that owns the grid in your area.',
      patterns: [/elbolag|elhandel/i, /elnät/i, /\bkWh\b/i, /mätarställning/i, /elavtal/i, /\bVattenfall\b|\bE\.ON\b|\bFortum\b|\bEllevio\b/i, /avstängning|frånkoppling/i],
      letters: ['Elräkning — your bill', 'Påminnelse — an unpaid bill', 'Varsel om avstängning — they plan to cut the electricity'],
      tips: ['Before cutting electricity to a home, they must warn you and the social services. Contact them right away to make a plan.'],
    },
    {
      id: 'region',
      slug: 'region-vard',
      name: 'Health care',
      local: 'Region (vården)',
      about: 'The region runs public health care. It sends appointments and bills for patient fees.',
      patterns: [/\bregion\b/i, /vårdcentral/i, /\bsjukhus\b/i, /patientavgift/i, /kallelse till (?:besök|undersökning)/i, /1177/],
      letters: ['Kallelse — date and time of a health care appointment', 'Faktura — a patient fee'],
      tips: ['If you can’t come, cancel the appointment — if you don’t, you may have to pay a fee.'],
    },
  ],
  kinds: [
    {
      id: 'utmatning', type: 'enforcement', local: 'Utmätning / Löneutmätning', name: 'Seizure by Kronofogden', about: 'Kronofogden will take money from your salary, bank account or property to pay a debt.', urgency: 'high', objection: false, patterns: [/utmätning/i, /löneutmätning/i, /verkställighet/i, /beslut om utmätning/i],
      steps: ['Contact Kronofogden today. Ask how much is protected (förbehållsbelopp) and if you can make a plan.', 'If you have many debts you can’t pay, ask about debt relief (skuldsanering). Your kommun’s debt advice can help for free.'],
    },
    {
      id: 'betalningsforelaggande', type: 'court-order', local: 'Betalningsföreläggande', name: 'Payment order', about: 'Someone asked Kronofogden to make you pay. If you don’t answer by the date, Kronofogden can decide that you must pay.', urgency: 'high', objection: false, extendable: false, patterns: [/betalningsföreläggande/i, /ansökan om betalningsföreläggande/i, /\bföreläggande\b/i, /delgivningskvitto/i],
      steps: ['If you don’t agree, dispute it (bestrid) by the date in the letter — online with BankID or in writing. Then the creditor must go to court.', 'If you agree, pay the creditor directly before the date and tell Kronofogden. A decision against you gives a payment remark (betalningsanmärkning).'],
    },
    {
      id: 'stamning', type: 'court-order', local: 'Stämning', name: 'Court case against you', about: 'Someone is taking you to court. You must answer by the date the court gives.', urgency: 'high', objection: false, extendable: false, patterns: [/stämning/i, /svaromål/i, /föreläggande att svara/i],
      steps: ['Send your answer (svaromål) to the court by the date given. If you don’t, the court can decide against you without a hearing.'],
    },
    {
      id: 'inkassokrav', type: 'reminder', local: 'Inkassokrav', name: 'Debt collection letter', about: 'A debt collector asks you to pay an unpaid bill. If you don’t pay or dispute, they can apply to Kronofogden.', urgency: 'high', patterns: [/inkassokrav/i, /inkasso/i, /ansökan hos Kronofogden/i],
      steps: ['If the claim is wrong, dispute it in writing within the time given (at least 8 days). There is a ready-made letter below.'],
    },
    {
      id: 'paminnelse', type: 'reminder', local: 'Påminnelse', name: 'Payment reminder', about: 'A payment is late. A reminder fee or interest may be added.', urgency: 'high', patterns: [/påminnelse/i, /betalningspåminnelse/i, /förfallen/i, /obetald/i, /ej betald|inte betalats/i],
    },
    {
      id: 'aterkrav', type: 'repayment', local: 'Återkrav', name: 'Request to pay money back', about: 'They say you got too much money, for example from Försäkringskassan, a-kassa or CSN, and want it back.', urgency: 'high', patterns: [/återkrav/i, /återbetalningsskyldig/i, /betala tillbaka/i, /felaktigt utbetal/i, /fått för mycket|för mycket utbetal/i],
      steps: ['If you think it’s wrong, ask for omprövning within the time in the letter (often two months).', 'If you can’t pay at once, ask for an avbetalningsplan or for the claim to be lowered because of your situation.'],
    },
    {
      id: 'boter', type: 'fine', local: 'Ordningsbot / Strafföreläggande / Avgift', name: 'Fine', about: 'A fine, for example for speeding, parking or a missing payment. Pay or answer by the date in the letter.', urgency: 'high', patterns: [/ordningsbot/i, /strafföreläggande/i, /felparkeringsavgift|parkeringsanmärkning/i, /tilläggsavgift/i, /\bböter\b/i],
      steps: ['If you don’t accept the fine, follow the instructions in the letter — the case can then go to court.'],
    },
    {
      id: 'slutskattebesked', type: 'tax-assessment', local: 'Slutskattebesked', name: 'Final tax statement', about: 'Your final tax for the year. It shows if you get money back or must pay tax (restskatt).', urgency: 'medium', patterns: [/slutskattebesked/i, /restskatt/i, /beslut om (?:slutlig )?skatt/i, /inkomstår/i, /skatt att betala/i],
      steps: ['Check the figures. If something is wrong, ask Skatteverket for omprövning.', 'Pay restskatt to your tax account with your OCR number by the due date, or interest is added.'],
    },
    {
      id: 'beslut', type: 'decision', local: 'Beslut', name: 'Decision', about: 'A decision about your benefits, permit or another request — for example what you get, a change or that it stops.', urgency: 'medium', weight: 0.7, patterns: [/\bbeslut\b/i, /vi har beslutat/i, /beslutet gäller/i, /hur man överklagar|om du vill överklaga|om du inte är nöjd/i],
      steps: ['Read the part about how to ask for omprövning or appeal (överklaga). It says where and by when — often two months for omprövning and three weeks to appeal.'],
    },
    {
      id: 'avslag', type: 'rejection', local: 'Avslag', name: 'Refusal', about: 'Your application was refused. The letter says how and by when you can appeal.', urgency: 'medium', patterns: [/\bavslag\b/i, /avslår/i, /får inte (?:ersättning|bidrag|uppehållstillstånd)/i, /beviljas inte/i],
      steps: ['If you think it’s wrong, appeal within the time in the letter — often three weeks. For migration decisions, get advice quickly.'],
    },
    { id: 'beviljat', type: 'approval', local: 'Beviljat', name: 'Approval', about: 'Your application was approved. Check that the amounts and dates are right.', urgency: 'low', patterns: [/beviljas|beviljat|beviljad/i, /du får (?:ersättning|bidrag)/i, /har godkänts/i] },
    {
      id: 'kallelse', type: 'appointment', local: 'Kallelse', name: 'Appointment', about: 'They want you to come to a meeting or appointment. Missing it can cut your benefits or delay your case.', urgency: 'medium', patterns: [/kallelse/i, /\bkallas\b|\bkallad\b/i, /bokad tid/i, /\bbesök\b/i, /\bmöte\b/i, /\bintervju\b/i],
    },
    {
      id: 'komplettering', type: 'documents', local: 'Begäran om komplettering', name: 'Request for documents', about: 'They need more information or papers before they can decide.', urgency: 'medium', patterns: [/komplettering/i, /komplettera/i, /begäran om uppgifter/i, /skicka in (?:följande|handlingar|intyg)/i, /saknar uppgifter/i] },
    {
      id: 'underrattelse', type: 'hearing', local: 'Underrättelse / Kommunicering', name: 'Chance to give your side', about: 'They plan a decision that affects you and invite you to give your side first.', urgency: 'medium', objection: false, patterns: [/underrättelse/i, /kommunicering/i, /du har möjlighet att yttra dig/i, /lämna synpunkter/i, /innan vi fattar beslut/i] },
    {
      id: 'uppsagning', type: 'termination', local: 'Uppsägning', name: 'Notice to end a contract', about: 'Someone ends a contract with you — for example your landlord or employer.', urgency: 'high', objection: false, patterns: [/uppsägning/i, /säger upp/i, /avflytta|avflyttning/i, /avhysning/i],
      steps: ['Check the notice period and the reason. For your home, ask Hyresgästföreningen before you agree to move out.'],
    },
    {
      id: 'elrakning', type: 'utility-bill', local: 'Elräkning', name: 'Electricity bill', about: 'A bill for electricity or the grid.', urgency: 'medium', patterns: [/\bkWh\b/i, /mätarställning/i, /elräkning/i, /nätavgift/i, /förbrukning/i] },
    { id: 'faktura', type: 'bill', local: 'Faktura', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bfaktura\b/i, /förfallodag|förfallodatum/i, /att betala/i, /\bOCR\b/] },
  ],
  references: [
    { name: 'Case number', local: 'Ärendenummer', pattern: /(?:(?<![A-Za-zÀ-ɏ])ärendenummer|(?<![A-Za-zÀ-ɏ])ärende\s?(?:nr|nummer)|\bdiarienummer|\bdnr\.?|\bvår referens)/gi },
    { name: 'Case number at Kronofogden or court', local: 'Målnummer', pattern: /(?:\bmålnummer|\bmål\s?nr\.?)/gi },
    { name: 'Invoice number', local: 'Fakturanummer', pattern: /\bfakturanummer|\bfaktura\s?nr\.?/gi },
    { name: 'Customer number', local: 'Kundnummer', pattern: /(?:\bkundnummer|\bkund\s?nr\.?|\bavtalsnummer|\banläggnings-?id)/gi },
    { name: 'Vehicle registration', local: 'Registreringsnummer', pattern: /\bregistreringsnummer|\breg\.?\s?nr\.?/gi },
    { name: 'Personal identity number', local: 'Personnummer', personal: true, pattern: /(?:\bpersonnummer|\bsamordningsnummer|\bpersonnr\.?)/gi },
    { name: 'OCR number', local: 'OCR-nummer', payment: true, pattern: /\bOCR(?:-?nummer)?/gi },
  ],
  glossary: [
    { term: 'Skatteverket', slug: 'skatteverket', pattern: /Skatteverket/i, meaning: 'The Swedish tax office. It also keeps the population register (folkbokföring).' },
    { term: 'slutskattebesked', slug: 'slutskattebesked', pattern: /slutskattebesked/i, meaning: 'Your final tax statement for the year: money back or tax to pay.' },
    { term: 'restskatt', slug: 'restskatt', pattern: /restskatt/i, meaning: 'Tax you still have to pay for the year.', tip: 'Pay it to your tax account with your OCR number by the due date, or interest is added.' },
    { term: 'skattekonto', slug: 'skattekonto', pattern: /skattekonto/i, meaning: 'Your tax account at Skatteverket. Tax payments and refunds go through it.' },
    { term: 'folkbokföring', slug: 'folkbokforing', pattern: /folkbokför/i, meaning: 'The population register — where you are registered as living.' },
    { term: 'personnummer', slug: 'personnummer', pattern: /personnummer/i, meaning: 'Your personal identity number, like 850730-1234.' },
    { term: 'samordningsnummer', slug: 'samordningsnummer', pattern: /samordningsnummer/i, meaning: 'An identity number for people who are not, or not yet, registered as living in Sweden.' },
    { term: 'OCR-nummer', slug: 'ocr-nummer', pattern: /\bOCR(?:-?nummer)?\b/i, meaning: 'Payment reference number. It links your payment to your bill.', tip: 'Copy it exactly into the reference field when you pay.' },
    { term: 'bankgiro', slug: 'bankgiro', pattern: /bankgiro/i, meaning: 'An account number used for bill payments in Sweden, like 123-4567.' },
    { term: 'plusgiro', slug: 'plusgiro', pattern: /plusgiro/i, meaning: 'Another account number used for bill payments, like 12 34 56-7.' },
    { term: 'förfallodag', slug: 'forfallodag', pattern: /förfallodag|förfallodatum/i, meaning: 'Due date — the last day to pay.' },
    { term: 'omprövning', slug: 'omprovning', pattern: /omprövning|ompröva/i, meaning: 'A request to the same office to look at its decision again.', tip: 'Often you must ask within two months from the day you got the decision.' },
    { term: 'överklaga', slug: 'overklaga', pattern: /överklag/i, meaning: 'To appeal a decision to a court or higher office.', tip: 'Send the appeal to the office that made the decision, usually within three weeks.' },
    { term: 'fick del av beslutet', slug: 'fick-del-av-beslutet', pattern: /fick del av|delgiv/i, meaning: 'The day you received the decision. Many deadlines start then.' },
    { term: 'förvaltningsrätt', slug: 'forvaltningsratt', pattern: /förvaltningsrätt/i, meaning: 'Administrative court. It handles appeals against decisions by offices and the kommun.' },
    { term: 'Försäkringskassan', slug: 'forsakringskassan', pattern: /Försäkringskassan/i, meaning: 'The social insurance office. It pays child benefit, parental benefit, sickness benefit and more.' },
    { term: 'återkrav', slug: 'aterkrav', pattern: /återkrav/i, meaning: 'A claim to pay back money you got but weren’t entitled to.', tip: 'Ask for omprövning if it’s wrong, or ask to pay in parts.' },
    { term: 'barnbidrag', slug: 'barnbidrag', pattern: /barnbidrag/i, meaning: 'Child benefit, paid every month for each child.' },
    { term: 'föräldrapenning', slug: 'foraldrapenning', pattern: /föräldrapenning/i, meaning: 'Parental benefit when you stay home with your child.' },
    { term: 'bostadsbidrag', slug: 'bostadsbidrag', pattern: /bostadsbidrag/i, meaning: 'Housing allowance for families with children and young people with low income.' },
    { term: 'Kronofogden', slug: 'kronofogden', pattern: /Kronofogden/i, meaning: 'The Swedish Enforcement Authority. It collects debts and handles payment orders.' },
    { term: 'betalningsföreläggande', slug: 'betalningsforelaggande', pattern: /betalningsföreläggande/i, meaning: 'A payment order. Someone asks Kronofogden to decide that you must pay.', tip: 'Dispute it (bestrid) by the date in the letter if you don’t agree.' },
    { term: 'bestrida', slug: 'bestrida', pattern: /bestrid/i, meaning: 'To dispute a claim — to say you don’t agree that you owe the money.' },
    { term: 'utmätning', slug: 'utmatning', pattern: /utmätning/i, meaning: 'Seizure of money or property to pay a debt, for example part of your salary.' },
    { term: 'betalningsanmärkning', slug: 'betalningsanmarkning', pattern: /betalningsanmärkning/i, meaning: 'A payment remark — a note that you didn’t pay a debt. It makes it hard to rent or borrow, usually for three years.' },
    { term: 'skuldsanering', slug: 'skuldsanering', pattern: /skuldsanering/i, meaning: 'Debt relief decided by Kronofogden for people who can’t pay their debts.' },
    { term: 'inkassokrav', slug: 'inkassokrav', pattern: /inkasso/i, meaning: 'A demand from a debt collector to pay an unpaid bill.' },
    { term: 'påminnelseavgift', slug: 'paminnelseavgift', pattern: /påminnelseavgift/i, meaning: 'A reminder fee. It is limited by law.' },
    { term: 'avbetalningsplan', slug: 'avbetalningsplan', pattern: /avbetalning/i, meaning: 'A plan to pay a debt in monthly parts.' },
    { term: 'anstånd', slug: 'anstand', pattern: /anstånd/i, meaning: 'A delay — more time to pay or to answer.' },
    { term: 'ekonomiskt bistånd', slug: 'ekonomiskt-bistand', pattern: /ekonomiskt bistånd|försörjningsstöd/i, meaning: 'Social assistance from the kommun for people who can’t support themselves.' },
    { term: 'a-kassa', slug: 'a-kassa-ord', pattern: /\ba-kassa/i, meaning: 'Unemployment insurance fund, and the benefit it pays.' },
    { term: 'aktivitetsrapport', slug: 'aktivitetsrapport', pattern: /aktivitetsrapport/i, meaning: 'A monthly report to Arbetsförmedlingen about your job search.' },
    { term: 'uppehållstillstånd', slug: 'uppehallstillstand', pattern: /uppehållstillstånd/i, meaning: 'Residence permit.' },
    { term: 'kallelse', slug: 'kallelse', pattern: /kallelse/i, meaning: 'An invitation to an appointment, meeting or hearing.' },
    { term: 'komplettering', slug: 'komplettering', pattern: /komplettering|komplettera/i, meaning: 'A request to send more information or papers.' },
    { term: 'ordningsbot', slug: 'ordningsbot', pattern: /ordningsbot/i, meaning: 'A fixed fine for a minor offence, for example speeding.' },
    { term: 'strafföreläggande', slug: 'strafforelaggande', pattern: /strafföreläggande/i, meaning: 'An offer from the prosecutor to accept a fine instead of a court case.' },
    { term: 'trängselskatt', slug: 'trangselskatt', pattern: /trängselskatt/i, meaning: 'Congestion tax for driving into central Stockholm or Gothenburg.' },
    { term: 'uppsägning', slug: 'uppsagning', pattern: /uppsägning|säger upp/i, meaning: 'Notice that a contract will end, for example your rental contract.' },
    { term: 'hyresnämnden', slug: 'hyresnamnden', pattern: /hyresnämnd/i, meaning: 'The rent tribunal. It helps settle disputes between tenants and landlords.' },
  ],
  extraReplies: [
    {
      id: 'bestrida',
      title: 'Dispute the claim (bestridande)',
      advice: 'Use this if you don’t agree that you owe the money. Send it by the date in the letter — for Kronofogden you can also dispute online with BankID. Keep a copy.',
      english: 'I dispute the claim. Reason: [your reason]. I do not owe this money.',
      subject: 'Ärende: Bestridande av krav',
      body: (result) => [
        `Jag bestrider kravet i ert brev ${letterOf(result)}${result.references.find((reference) => reference.name.startsWith('Case number at')) ? `, målnummer ${result.references.find((reference) => reference.name.startsWith('Case number at')).value}` : ''}.`,
        '',
        `Skäl: [Förklara varför du inte är skyldig att betala ${amountOf(result)}, till exempel: jag har redan betalat / jag har aldrig beställt tjänsten.]`,
        '',
        '[Jag bifogar kopior av kvitton eller avtal.]',
      ],
      when: (result) => ['kronofogden', 'inkasso'].includes(result.sender?.id) || ['betalningsforelaggande', 'inkassokrav'].includes(result.kind?.id),
      replaces: 'objection',
    },
  ],
  samples: [
    {
      id: 'forsakringskassan',
      title: 'Försäkringskassan',
      subtitle: 'Claim to pay back money',
      build(today) {
        const letter = addDays(today, -3);
        const due = addDays(letter, 30);
        return `Försäkringskassan
103 51 Stockholm

Datum: ${swedishDate(letter)}
Ärendenummer: 123456789
Personnummer: 850730-1234

Anna Exempel
Exempelgatan 12
123 45 Exempelstad

Beslut om återkrav av bostadsbidrag

Hej Anna Exempel,

Vi har beslutat att du ska betala tillbaka bostadsbidrag som du har fått för mycket under perioden 2026-01-01 till och med 2026-06-30. Det beror på att din inkomst var högre än du uppgav.

Belopp att betala: 4 320 kr
Sista betalningsdag: ${swedishDate(due)}
Betala till bankgiro 123-4567 och ange OCR-nummer 8507301234567.

Om du inte kan betala hela beloppet på en gång kan du ansöka om en avbetalningsplan.

Om du inte är nöjd med beslutet kan du begära omprövning. Din begäran ska ha kommit in till Försäkringskassan inom två månader från den dag du fick del av beslutet.

Med vänliga hälsningar
Försäkringskassan`;
      },
    },
    {
      id: 'migrationsverket',
      title: 'Migrationsverket',
      subtitle: 'Appointment for a residence permit',
      build(today) {
        const letter = addDays(today, -2);
        const appointment = nextWorkday(addDays(today, 8));
        return `Migrationsverket
601 70 Norrköping

Datum: ${swedishDate(letter)}
Ärendenummer: 25-123456

Rahul Exempel
Storgatan 5 lgh 1102
171 45 Solna

Kallelse till besök

Hej,

Du är kallad till ett besök hos Migrationsverket den ${longDate(appointment)} kl. 09.30 på vårt kontor i Solna, Exempelvägen 10.

Vid besöket tar vi ditt foto och dina fingeravtryck för ditt uppehållstillståndskort.

Ta med:
- ditt pass
- denna kallelse

Om du inte kan komma, kontakta oss så snart som möjligt för att boka en ny tid.

Med vänliga hälsningar
Migrationsverket`;
      },
    },
  ],
};
