import { addDays, addMonths, formatLocalDate, fromIso } from '../dates.js';

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

const dutchDate = (iso) => formatLocalDate(iso, '-');

function letterOf(result) {
  return result.letterDate ? `van ${dutchDate(result.letterDate)}` : 'van [DD-MM-JJJJ]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: money.currency ?? 'EUR' }).format(money.amount) : '[bedrag]';
}

export default {
  id: 'nl',
  slug: 'netherlands',
  name: 'Netherlands',
  inName: 'the Netherlands',
  adjective: 'Dutch',
  flag: '🇳🇱',
  language: 'nl',
  currency: 'EUR',
  decimal: ',',
  thousands: '.',
  dateSeparator: '-',
  dateOrder: 'dmy',
  ibanLength: 18,
  intro: 'Many Dutch offices can send their letters to your online Berichtenbox in MijnOverheid, so check it often — you log in with DigiD. If you disagree with a decision, you can usually object in writing (bezwaar) within 6 weeks of the date on the letter.',
  signals: [
    /\bNederland\b/i,
    /\.nl\b/i,
    /overheid\.nl/i,
    /\bNL\d{2}\s?[A-Z]{4}/,
    /\b[1-9]\d{3}\s?[A-Z]{2}\b/,
    /\bBSN\b|burgerservicenummer/i,
    /belastingdienst/i,
    /\bCJIB\b/,
    /\bgemeente\b/i,
    /\bDigiD\b/i,
    /mijn ?overheid/i,
    /\bUWV\b/,
    /betalingskenmerk/i,
  ],
  deliveryDays: 0,
  deadlineWords: ['termijn', 'uiterlijk', 'binnen'],
  deliveryNote: 'In the Netherlands, the time to object usually starts the day after the date on the letter (dagtekening), not the day it arrives. So count from the date on the letter.',
  objectionAdvice: 'Use this if you think the decision is wrong. Send it before the deadline, signed, with the date or number of the decision. If you need more time for your reasons, send it anyway — the office usually gives you time to add them.',
  objection: [
    { word: 'bezwaar', pattern: /bezwaar/i },
    { word: 'beroep', pattern: /beroepschrift|\bin beroep\b|\bberoep (?:in(?:stellen)?|aantekenen|indienen|bij|tegen)\b/i },
    { word: 'verzet', pattern: /verzetschrift|\bin verzet\b|\bverzet (?:in(?:stellen)?|aantekenen|indienen|doen|bij|tegen)\b/i },
  ],
  help: {
    debt: 'free debt help from your gemeente (schuldhulpverlening)',
    tenant: 'the Juridisch Loket, the Woonbond or a local tenants’ help desk (huurteam)',
    instalments: 'betalingsregeling',
    general: 'the Juridisch Loket (free legal advice), or the Informatiepunt Digitale Overheid in your local library',
  },
  cancelTips: [
    'You can cancel the same way you signed up. If you signed up online, you can cancel online.',
    'Phone, internet and TV: the first term can be at most 2 years. After that, you can cancel any time for free, with at most 1 month’s notice.',
    'Energy: the notice period is at most 1 month. Variable and dynamic contracts can be cancelled without a fee.',
    'Insurance: after the first year, you can usually cancel any time with at most 1 month’s notice. You can always cancel online.',
  ],
  cancelRules: [
    {
      since: '2011-12-01',
      notice: '1m',
      text: 'For most subscriptions made since 1 December 2011, like gyms, papers, phone and energy, the notice period can be at most 1 month. After the first term, you can cancel any time, even if the contract says it renews.',
    },
  ],
  senders: [
    {
      id: 'belastingdienst',
      slug: 'belastingdienst',
      name: 'Tax office',
      local: 'Belastingdienst',
      about: 'The national tax office. It handles income tax, VAT for the self-employed and car tax.',
      patterns: [/belastingdienst(?!\s*\/\s*toeslagen)/i, /inkomstenbelasting/i, /premie volksverzekeringen/i, /aanslagbiljet/i, /mijn belastingdienst/i, /\bloonheffing/i, /motorrijtuigenbelasting/i, /\bomzetbelasting\b/i, /fiscaal nummer/i],
      letters: ['Aanslag inkomstenbelasting — the result of your income tax return', 'Voorlopige aanslag — an advance tax bill or refund, often paid monthly', 'Uitnodiging aangifte doen — a request to file your tax return, usually by 1 May', 'Aanmaning — you paid tax late'],
      tips: ['You can object (bezwaar) within 6 weeks after the date on the letter. You can do this online in Mijn Belastingdienst.', 'Can’t pay on time? Ask for a payment plan (betalingsregeling) before the payment date.'],
    },
    {
      id: 'toeslagen',
      slug: 'toeslagen',
      name: 'Allowances office',
      local: 'Dienst Toeslagen (Belastingdienst/Toeslagen)',
      about: 'Pays allowances that help with the costs of health insurance, rent and childcare: zorgtoeslag, huurtoeslag, kinderopvangtoeslag and kindgebonden budget.',
      patterns: [/toeslagen/i, /zorgtoeslag/i, /huurtoeslag/i, /kinderopvangtoeslag/i, /kindgebonden budget/i, /\btoeslag\b/i],
      letters: ['Voorschotbeschikking — how much you get each month as an advance', 'Definitieve berekening — the final amount, after the year is over', 'Terugvordering — you got too much and must pay it back', 'Verzoek om gegevens — they need information, for example about your income or rent'],
      tips: ['A toeslag is an advance based on your expected income. Change your income in Mijn toeslagen as soon as it changes, or you may have to pay a lot back later.', 'If you must pay money back, you can usually ask for a payment plan (betalingsregeling).'],
    },
    {
      id: 'cjib',
      slug: 'cjib',
      name: 'Fines collection agency',
      local: 'CJIB (Centraal Justitieel Incassobureau)',
      about: 'Collects fines for the government, for example speeding fines. It sends the payment letters and the reminders.',
      patterns: [/\bCJIB\b/i, /centraal justitieel incassobureau/i, /\bWahv\b/i, /wet mulder/i, /verkeersboete/i, /officier van justitie/i, /strafbeschikking/i],
      letters: ['Beschikking — a traffic fine', 'Eerste aanmaning — you paid late, and extra costs are added', 'Tweede aanmaning — you still haven’t paid, and more costs are added', 'Strafbeschikking — a criminal fine from the public prosecutor'],
      tips: ['Pay before the date on the letter. Each reminder (aanmaning) makes the fine more expensive.', 'A traffic fine goes to the person the car is registered to, even if someone else was driving.'],
    },
    {
      id: 'gemeente',
      slug: 'gemeente',
      name: 'Town hall',
      local: 'Gemeente',
      about: 'Your town or city. It registers your address (BRP), collects local taxes and helps with income support (bijstand) and debt problems.',
      patterns: [/\bgemeente\b/i, /gemeentelijke belastingen/i, /\bOZB\b/, /onroerende ?-?zaakbelasting/i, /afvalstoffenheffing/i, /rioolheffing/i, /\bBRP\b/, /basisregistratie personen/i, /burgerzaken/i, /participatiewet/i, /\bbijstand/i, /parkeerbelasting/i, /\bWOZ\b/, /\bWmo\b/],
      letters: ['Aanslag gemeentelijke belastingen — your yearly local taxes, often with the WOZ value of your home', 'Inschrijving in de BRP — your address registration', 'Naheffingsaanslag parkeerbelasting — a parking charge because you didn’t pay for parking', 'Besluit bijstand — a decision about income support'],
      tips: ['When you move, register your new address with the gemeente — from 4 weeks before until 5 days after the move.', 'If your income is low, you can often ask for kwijtschelding (cancellation) of local taxes, like the waste tax.'],
    },
    {
      id: 'waterschap',
      slug: 'waterschap',
      name: 'Water board',
      local: 'Waterschap / hoogheemraadschap',
      about: 'A regional office that looks after dikes, water levels and cleaning waste water. Every household gets a yearly water board tax bill.',
      patterns: [/waterschap/i, /hoogheemraadschap/i, /wetterskip/i, /zuiveringsheffing/i, /watersysteemheffing/i],
      letters: ['Aanslag waterschapsbelasting — the yearly water board tax', 'Kwijtschelding — the answer to your request to cancel the tax'],
      tips: ['In many areas this tax comes on one bill with your local taxes, from a shared tax office.', 'If your income is low, you can ask for kwijtschelding.'],
    },
    {
      id: 'uwv',
      slug: 'uwv',
      name: 'Employee insurance agency',
      local: 'UWV',
      about: 'Pays unemployment benefit (WW), sickness benefit and disability benefit, and helps you find work.',
      patterns: [/\bUWV\b/, /uitvoeringsinstituut werknemersverzekeringen/i, /\bWW\b/, /ww-uitkering/i, /\bWIA\b/, /ziektewet/i, /\bwajong\b/i, /werk\.nl/i, /werkcoach/i, /verzekeringsarts/i, /mijn uwv/i],
      letters: ['Beslissing op uw aanvraag WW — whether you get unemployment benefit, and how much', 'Uitnodiging — an appointment, for example with a work coach or a doctor', 'Terugvordering — you got too much benefit and must pay it back', 'Inkomstenopgave — you must report what you earned'],
      tips: ['Apply for WW soon after your job ends — UWV asks you to do this within 1 week.', 'Report all income and changes in Mijn UWV. If you don’t, you may have to pay money back.'],
    },
    {
      id: 'ind',
      slug: 'ind',
      name: 'Immigration and naturalisation service',
      local: 'IND (Immigratie- en Naturalisatiedienst)',
      about: 'Decides on residence permits, visas for long stays and Dutch citizenship.',
      patterns: [/\bIND\b/, /immigratie- en naturalisatiedienst/i, /verblijfsvergunning/i, /verblijfsdocument/i, /\bv-nummer\b/i, /vreemdelingennummer/i, /naturalisatie/i, /biometrische gegevens/i, /\bMVV\b/, /ind\.nl/i],
      letters: ['Uitnodiging biometrie — an appointment to give your photo and fingerprints', 'Besluit op uw aanvraag — the decision on your residence permit', 'Voornemen — they plan to refuse and let you react first (zienswijze)', 'Verblijfsdocument ophalen — your residence card is ready to collect'],
      tips: ['The deadline to object to an IND decision is usually 4 weeks, not 6. Check the letter.', 'Apply to extend your permit before it ends. Your V-nummer is on every letter — use it when you contact them.'],
    },
    {
      id: 'svb',
      slug: 'svb',
      name: 'Social insurance bank',
      local: 'SVB (Sociale Verzekeringsbank)',
      about: 'Pays child benefit (kinderbijslag) and the state pension (AOW).',
      patterns: [/\bSVB\b/, /sociale verzekeringsbank/i, /kinderbijslag/i, /\bAOW\b/, /\bAnw\b/, /mijn svb/i],
      letters: ['Beslissing kinderbijslag — whether you get child benefit, and how much', 'AOW — your state pension and the date it starts', 'Verzoek om informatie — they need proof, for example about your child or a stay abroad'],
      tips: ['Child benefit is paid every 3 months, after the end of each quarter.', 'You build up AOW for each year you live or work in the Netherlands. Years abroad can mean a lower AOW.'],
    },
    {
      id: 'duo',
      slug: 'duo',
      name: 'Education executive agency',
      local: 'DUO (Dienst Uitvoering Onderwijs)',
      about: 'Handles student finance, student loan repayments and the civic integration exams (inburgering).',
      patterns: [/\bDUO\b/, /dienst uitvoering onderwijs/i, /studiefinanciering/i, /studieschuld/i, /inburgering/i, /mijn duo/i],
      letters: ['Beschikking studiefinanciering — how much student finance you get', 'Aflossing studieschuld — your monthly student loan repayment', 'Inburgeringsplicht — you must pass the civic integration exam by a set date', 'Boete inburgering — a fine because you missed the integration deadline'],
      tips: ['If your income is low, ask DUO to lower your monthly repayment.', 'Check your integration deadline in your DUO account, and ask for more time before it ends if you need it.'],
    },
    {
      id: 'zorgverzekeraar',
      slug: 'zorgverzekeraar',
      name: 'Health insurance company',
      local: 'Zorgverzekeraar (CZ, VGZ, Zilveren Kruis, Menzis…)',
      about: 'Your health insurer. Everyone who lives or works in the Netherlands must have basic health insurance (basisverzekering).',
      patterns: [/zorgverzekeraar/i, /zorgverzekering/i, /basisverzekering/i, /aanvullende verzekering/i, /eigen risico/i, /\bCZ\b/, /\bVGZ\b/, /zilveren kruis/i, /\bmenzis\b/i, /\bONVZ\b/, /\bDSW\b/, /zorg en zekerheid/i, /premienota/i],
      letters: ['Premienota — your monthly premium bill', 'Nota eigen risico — the part of your care costs you pay yourself', 'Betalingsherinnering or aanmaning — unpaid premiums', 'Polisblad — your insurance details for the new year'],
      tips: ['If you miss several months of premiums, the CAK takes over and you pay a higher premium. Ask for a payment plan early.', 'You can switch to another insurer for the next year. Do it before 1 January — your new insurer usually cancels the old one for you.'],
    },
    {
      id: 'cak',
      slug: 'cak',
      name: 'Care contributions office',
      local: 'CAK',
      about: 'Collects your own contribution (eigen bijdrage) for care at home or in a care home. It also collects a higher premium from people with large health insurance debts.',
      patterns: [/\bCAK\b/, /centraal administratie kantoor/i, /eigen bijdrage/i, /bestuursrechtelijke premie/i, /wanbetalersregeling/i, /\bWlz\b/],
      letters: ['Beschikking eigen bijdrage — how much you pay towards your care', 'Bestuursrechtelijke premie — a higher health insurance premium, often taken from your wages or benefit', 'Factuur — a bill for your own contribution'],
      tips: ['If the amount looks too high, call the CAK. It may be based on an income you no longer have.'],
    },
    {
      id: 'deurwaarder',
      slug: 'gerechtsdeurwaarder',
      name: 'Bailiff',
      local: 'Gerechtsdeurwaarder',
      about: 'A legal officer who delivers court papers and collects debts. With a court decision or a dwangbevel, a bailiff can seize your wages, bank account or goods.',
      patterns: [/deurwaarder/i, /gerechtsdeurwaarder/i, /deurwaarderskantoor/i, /\bexploot\b/i, /betekening/i, /executoriale titel/i],
      letters: ['Exploot — an official paper delivered by the bailiff, for example a summons or a court decision', 'Dagvaarding — a summons to court', 'Beslag — they seize money or goods', 'Sommatie — a final demand to pay before they take further steps'],
      tips: ['Never ignore a bailiff. Call them, check what the debt is for, and ask for a payment plan.', 'They must always leave you enough to live on (beslagvrije voet). Check that they use the right amount.'],
    },
    {
      id: 'incasso',
      slug: 'incassobureau',
      name: 'Debt collection agency',
      local: 'Incassobureau',
      about: 'A company that collects unpaid bills for someone else. It can’t seize anything itself — only a bailiff can, usually after a court decision.',
      patterns: [/incassobureau/i, /incassokosten/i, /incassotraject/i, /veertiendagenbrief|14-dagenbrief/i, /\bhoofdsom\b/i, /(?:onze|uw) (?:cliënt|client|opdrachtgever)/i],
      letters: ['Sommatie or aanmaning — a demand to pay a debt plus costs', 'Veertiendagenbrief — your last chance to pay within 14 days without collection costs', 'Betalingsregeling — an offer to pay in parts'],
      tips: ['Collection costs are capped by law. Before they may charge them, you must get a letter that gives you 14 days to pay.', 'Don’t recognise the debt? Ask for proof in writing before you pay.'],
    },
    {
      id: 'rechtbank',
      slug: 'rechtbank',
      name: 'Court',
      local: 'Rechtbank / kantonrechter',
      about: 'A court. The kantonrechter handles rent, work and smaller money claims. Letters from a court are always important — never ignore them.',
      patterns: [/rechtbank/i, /kantonrechter/i, /sector kanton/i, /\bgerechtshof\b/i, /\bvonnis\b/i, /\bdagvaarding\b/i, /\bgriffie\b/i, /griffierecht/i, /rechtspraak\.nl/i, /\bkort geding\b/i],
      letters: ['Dagvaarding — you are summoned to court, usually through a bailiff', 'Oproeping — an invitation to a court hearing (zitting)', 'Vonnis or uitspraak — the court’s decision'],
      tips: ['At the kantonrechter you don’t need a lawyer. You can react yourself, in writing or at the hearing.', 'Get free legal advice quickly, for example at the Juridisch Loket.'],
    },
    {
      id: 'verhuurder',
      slug: 'verhuurder',
      name: 'Landlord or housing association',
      local: 'Verhuurder / woningcorporatie',
      about: 'The owner of your home, a letting agent, or a housing association that rents out social housing.',
      patterns: [/verhuurder/i, /woningcorporatie/i, /woningstichting/i, /woonstichting/i, /woningbouwvereniging/i, /huurovereenkomst/i, /huurcontract/i, /\bhuurder\b/i, /huurverhoging/i, /servicekosten/i, /\bhuurprijs\b/i, /kale huur/i],
      letters: ['Huurverhoging — a rent increase, often from 1 July', 'Jaarafrekening servicekosten — the yearly bill for shared costs like cleaning or heating', 'Huuropzegging — notice to end your rental contract', 'Aanmaning — unpaid rent'],
      tips: ['If you think a rent increase or the service charges are wrong, tell your landlord in writing. The Huurcommissie can settle the dispute for a small fee.', 'A landlord can’t simply end a rental contract with no end date. If you don’t agree, only a judge can end it.'],
    },
    {
      id: 'energie',
      slug: 'energieleverancier',
      name: 'Energy supplier',
      local: 'Energieleverancier (Eneco, Vattenfall, Essent…)',
      about: 'The company that sells you electricity and gas. You usually pay a fixed amount each month and get a yearly bill.',
      patterns: [/energieleverancier/i, /energiecontract/i, /\bkWh\b/i, /\bm3\b|m³/i, /elektriciteit/i, /leveringskosten/i, /netbeheerder/i, /\beneco\b/i, /\bvattenfall\b/i, /\bessent\b/i, /greenchoice/i, /budget energie/i, /energiedirect/i, /meterstand/i, /EAN-code/i],
      letters: ['Jaarafrekening — the yearly bill after a meter reading', 'Termijnbedrag — your new monthly advance payment', 'Aanmaning — an unpaid bill', 'Afsluiting — they plan to cut off your supply'],
      tips: ['Before they can cut off your energy, they must try to help you first, for example with a payment plan or debt help. From 1 October to 1 April they usually may not cut you off.'],
    },
  ],
  kinds: [
    {
      id: 'dwangbevel', type: 'enforcement', local: 'Dwangbevel', name: 'Enforcement order', about: 'An official order to pay a tax or fine you didn’t pay. Extra costs are added. If you still don’t pay, they can seize your wages, bank account or goods.', urgency: 'high', objection: false, patterns: [/dwangbevel/i, /wij bevelen u/i],
      steps: ['A dwangbevel often gives you only 2 days to pay. If you can’t pay, call them today.'],
    },
    {
      id: 'beslag', type: 'enforcement', local: 'Beslag / beslaglegging', name: 'Seizure', about: 'They have taken, or will take, money or goods to pay a debt — for example part of your wages, benefit or bank account.', urgency: 'high', objection: false, patterns: [/beslaglegging/i, /\bbeslag\b/i, /loonbeslag/i, /bankbeslag/i, /beslagvrije voet/i],
      steps: ['They must leave you a basic amount to live on each month (beslagvrije voet). If you think it’s too low, tell them and send proof of your income and costs.'],
    },
    {
      id: 'boete', type: 'fine', local: 'Boete / beschikking CJIB', name: 'Fine', about: 'A fine, for example for speeding or wrong parking. The CJIB usually collects it. If you pay late, the amount goes up.', urgency: 'high', patterns: [/boete/i, /verkeersboete/i, /\bWahv\b/i, /wet mulder/i, /handhaving verkeersvoorschriften/i, /administratieve sanctie/i, /strafbeschikking/i],
      steps: ['If you agree, pay before the date on the letter. If you think the fine is wrong, the letter explains how to object — for most traffic fines within 6 weeks after the date on the letter. For a criminal fine (strafbeschikking) you often have only 2 weeks.', 'Even when you object to a traffic fine, you usually have to pay it first as a deposit (zekerheidstelling). You get it back if you win.'],
    },
    {
      id: 'terugvordering', type: 'repayment', local: 'Terugvordering', name: 'Request to pay money back', about: 'They believe they paid you too much — for example a toeslag or a benefit — and want the money back.', urgency: 'high', patterns: [/terugvordering/i, /terugvorderen/i, /terug te betalen/i, /terugbetalen/i, /te ?veel (?:ontvangen|gekregen|uitbetaald)/i, /onverschuldigd betaald/i],
      steps: ['Check the period and the amount. If you don’t understand them, ask how they worked it out.', 'Most offices let you pay it back in monthly parts (betalingsregeling). Ask before the payment date.'],
    },
    { id: 'aanmaning', type: 'reminder', local: 'Aanmaning', name: 'Payment demand', about: 'You haven’t paid on time. Extra costs are often added, and the next step can be a dwangbevel or a bailiff.', urgency: 'high', objection: false, patterns: [/aanmaning/i, /aanmaningskosten/i, /betalingsachterstand/i, /\bachterstand\b/i, /nog niet (?:betaald|voldaan)/i, /sommatie/i] },
    { id: 'herinnering', type: 'reminder', local: 'Herinnering', name: 'Reminder', about: 'A reminder that you haven’t paid or answered yet. Often there are no extra costs yet — but they may follow if you wait.', urgency: 'medium', objection: false, patterns: [/betalingsherinnering/i, /\bherinnering\b/i, /herinneren (?:wij )?u\b/i] },
    {
      id: 'uitnodiging', type: 'appointment', local: 'Uitnodiging / afspraak', name: 'Appointment', about: 'They want you to come to an appointment. If you don’t come without a good reason, it can affect your benefit or your application.', urgency: 'medium', patterns: [/uitnodiging(?!\s+(?:(?:tot|om|voor)\s+(?:het\s+doen\s+van\s+)?)?aangifte)/i, /nodigen (?:wij )?u\b[^.]{0,60}\buit\b/i, /uitgenodigd/i, /\bafspraak\b/i, /hoorzitting/i, /oproeping/i, /u wordt verwacht/i],
      steps: ['Bring everything the letter asks for, such as your passport or residence card, and arrive a little early.'],
    },
    { id: 'informatie', type: 'documents', local: 'Verzoek om informatie', name: 'Request for information', about: 'They need papers or information from you. If you don’t send them in time, they may stop a payment or not handle your application.', urgency: 'medium', patterns: [/verzoek om (?:informatie|gegevens|documenten|stukken|bewijsstukken)/i, /informatieverzoek/i, /\bstuur(?:t u)? ons\b/i, /ontbrekende (?:gegevens|informatie|documenten|stukken)/i, /aanvullende (?:gegevens|informatie|documenten|stukken)/i, /(?:wij hebben|hebben wij) (?:nog )?(?:meer )?(?:de volgende )?(?:informatie|gegevens|documenten|stukken) (?:van u )?nodig/i, /vragenformulier/i, /buiten behandeling (?:te )?(?:laten|stellen)\b/i] },
    {
      id: 'afwijzing', type: 'rejection', local: 'Afwijzing', name: 'Rejection', about: 'Your application was turned down. You can usually object if you think this is wrong.', urgency: 'medium', patterns: [/afwijzing/i, /afgewezen/i, /wijzen (?:wij )?uw aanvraag af/i, /niet in aanmerking/i, /buiten behandeling (?:gesteld|gelaten)/i, /geen recht (?:meer )?op/i],
      steps: ['Read the end of the letter. It says how long you have to object — usually 6 weeks, but for IND decisions usually 4 weeks.'],
    },
    {
      id: 'aanslag', type: 'tax-assessment', local: 'Aanslag', name: 'Tax assessment', about: 'A tax bill from the Belastingdienst, your gemeente or your water board. It shows how much tax you pay or get back. You can object (bezwaar) within 6 weeks after the date on the letter.', urgency: 'medium', patterns: [/(?<!voorlopige )\baanslag\b/i, /aanslagbiljet/i, /naheffingsaanslag/i, /gemeentelijke belastingen/i, /waterschapsbelasting/i],
      steps: ['Check your details and the amounts. If something is wrong, send a bezwaar within 6 weeks after the date on the letter (dagtekening). A bezwaar doesn’t stop the payment date — ask for a delay (uitstel van betaling) too if you need it.'],
    },
    {
      id: 'voorlopige-aanslag', type: 'tax-assessment', local: 'Voorlopige aanslag', name: 'Provisional tax assessment', about: 'An advance tax bill or refund, based on an estimate of your income. It is often paid in monthly parts. The final amount comes later.', urgency: 'medium', patterns: [/voorlopige aanslag/i, /voorlopige teruggaaf/i],
      steps: ['If the estimate of your income is wrong, change it in Mijn Belastingdienst. That is usually easier than a bezwaar.'],
    },
    { id: 'toekenning', type: 'approval', local: 'Toekenning', name: 'Approval', about: 'Your application was approved. The letter shows what you get, how much and from when.', urgency: 'low', patterns: [/toekenning/i, /toegekend/i, /kennen (?:wij )?u\b[^.]{0,60}\btoe\b/i, /\bu heeft recht op\b/i, /aanvraag (?:is )?goedgekeurd/i, /hebben uw aanvraag goedgekeurd/i] },
    {
      id: 'opzegging', type: 'termination', local: 'Opzegging / huuropzegging', name: 'Termination notice', about: 'A contract is being ended, for example your rental contract, your job or an insurance.', urgency: 'high', patterns: [/opzegging/i, /huuropzegging/i, /\bopgezegd\b/i, /\bzeggen wij\b[^.]{0,80}\bop\b/i, /beëindiging van (?:de|uw) (?:huur)?overeenkomst/i, /\bontslag\b/i],
      steps: ['If your landlord is ending a rental contract with no end date, you don’t have to agree. Then only a judge can end it. Get free advice before you move out or sign anything.'],
    },
    {
      id: 'jaarafrekening', type: 'utility-bill', local: 'Jaarafrekening', name: 'Yearly bill', about: 'The yearly bill for energy, or your landlord’s yearly bill for service charges. It compares what you used with what you already paid. You pay extra or get money back.', urgency: 'medium', patterns: [/jaarafrekening/i, /jaarnota/i, /eindafrekening/i, /afrekening (?:van de )?servicekosten/i, /\bmeterstand/i, /\bkWh\b/i],
      steps: ['Check the meter readings or the costs. If something looks wrong, ask for an explanation. For service charges, you can ask to see the receipts.'],
    },
    { id: 'factuur', type: 'bill', local: 'Factuur / nota', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bfactuur/i, /\bnota\b/i, /premienota/i, /termijnbedrag/i] },
    { id: 'beschikking', type: 'decision', local: 'Beschikking / besluit', name: 'Official decision', about: 'A formal decision by an office, for example about a benefit or a permit. You can usually object (bezwaar) — the end of the letter says how and by when.', urgency: 'medium', weight: 0.4, patterns: [/beschikking/i, /\bbesluit\b/i] },
  ],
  references: [
    { name: 'Assessment number', local: 'Aanslagnummer', pattern: /aanslagnummer/gi },
    { name: 'Payment reference', local: 'Betalingskenmerk', payment: true, pattern: /betalingskenmerk/gi },
    { name: 'CJIB number', local: 'CJIB-nummer', pattern: /cjib[- ]nummer/gi },
    { name: 'Decision number', local: 'Beschikkingsnummer', pattern: /beschikkingsnummer/gi },
    { name: 'Foreign national number', local: 'V-nummer', pattern: /(?:\bv-nummer|vreemdelingennummer)/gi },
    { name: 'Case number', local: 'Dossiernummer', pattern: /(?:dossiernummer|zaaknummer)/gi },
    { name: 'Customer number', local: 'Klantnummer', pattern: /klantnummer/gi },
    { name: 'Customer number', local: 'Relatienummer', pattern: /relatienummer/gi },
    { name: 'Policy number', local: 'Polisnummer', pattern: /polisnummer/gi },
    { name: 'Invoice number', local: 'Factuurnummer', pattern: /(?:factuurnummer|notanummer)/gi },
    { name: 'Reference', local: 'Kenmerk', pattern: /(?:\bons kenmerk|\buw kenmerk|\bkenmerk\b)/gi },
    { name: 'Citizen service number', local: 'BSN', personal: true, pattern: /(?:burgerservicenummer|\bBSN\b)(?:\/fiscaal nummer)?/gi },
  ],
  glossary: [
    { term: 'aanslag', slug: 'aanslag', pattern: /\baanslag/i, meaning: 'Tax assessment. A letter that says how much tax you must pay or get back.', tip: 'A bezwaar doesn’t stop the payment date. If you object, you can also ask for a delay (uitstel van betaling).' },
    { term: 'voorlopige aanslag', slug: 'voorlopige-aanslag', pattern: /voorlopige aanslag/i, meaning: 'Provisional tax assessment. An advance tax bill or refund based on your expected income.' },
    { term: 'beschikking', slug: 'beschikking', pattern: /beschikking|\bbesluit\b/i, meaning: 'Official decision by an office about you, for example about a benefit or a permit. Also called besluit.' },
    { term: 'bezwaar', slug: 'bezwaar', pattern: /bezwaar/i, meaning: 'Objection. A letter to the office saying its decision is wrong, asking it to look again.', tip: 'Send it before the deadline, signed. You can add your reasons later — the office usually gives you time for that.' },
    { term: 'beroep', slug: 'beroep', pattern: /\bberoep/i, meaning: 'Appeal. Usually the next step after a bezwaar, at a court. In other letters, beroep can also mean ‘profession’.' },
    { term: 'zienswijze', slug: 'zienswijze', pattern: /zienswijze/i, meaning: 'Your view. Your chance to react in writing before the office makes its decision.' },
    { term: 'termijn', slug: 'termijn', pattern: /(?<!opzeg)termijn/i, meaning: 'Time limit or deadline. In payment letters, a termijn can also be one instalment.', tip: 'Count from the date on the letter (dagtekening), not from the day it arrived.' },
    { term: 'dagtekening', slug: 'dagtekening', pattern: /dagtekening/i, meaning: 'The date on the letter. The time to object usually starts the day after this date.' },
    { term: 'aanmaning', slug: 'aanmaning', pattern: /aanmaning/i, meaning: 'Formal payment demand. You paid late, and costs are often added.' },
    { term: 'dwangbevel', slug: 'dwangbevel', pattern: /dwangbevel/i, meaning: 'Enforcement order. With it, an office can collect a tax or fine by force, without going to court.', tip: 'Act the same day: pay, or call and ask for a payment plan. Your gemeente offers free debt help.' },
    { term: 'beslag', slug: 'beslag', pattern: /\bbeslag(?:legging)?\b|loonbeslag|bankbeslag/i, meaning: 'Seizure of money or goods to pay a debt, for example part of your wages.' },
    { term: 'beslagvrije voet', slug: 'beslagvrije-voet', pattern: /beslagvrije voet/i, meaning: 'The part of your income that can’t be seized, so you can live on it.', tip: 'Check that the amount fits your situation. If it’s too low, tell them and send proof of your income and costs.' },
    { term: 'deurwaarder', slug: 'deurwaarder', pattern: /deurwaarder/i, meaning: 'Bailiff. A legal officer who delivers court papers and can seize money or goods.' },
    { term: 'dagvaarding', slug: 'dagvaarding', pattern: /dagvaarding/i, meaning: 'Court summons. Someone has started a court case against you. It says when the case starts.', tip: 'Don’t ignore it. If you don’t react, the judge usually decides without you. Get free advice at the Juridisch Loket.' },
    { term: 'incassobureau', slug: 'incassobureau', pattern: /incassobureau|incassokosten/i, meaning: 'Debt collection agency. A company that collects unpaid bills for someone else.', tip: 'Collection costs are capped by law. They may only charge them after a letter that gives you 14 days to pay.' },
    { term: 'betalingsregeling', slug: 'betalingsregeling', pattern: /betalingsregeling/i, meaning: 'Payment plan. You pay a debt in monthly parts.', tip: 'Ask for it before the payment date, and offer an amount you can really pay every month.' },
    { term: 'uitstel van betaling', slug: 'uitstel-van-betaling', pattern: /uitstel van betaling/i, meaning: 'More time to pay.' },
    { term: 'kwijtschelding', slug: 'kwijtschelding', pattern: /kwijtschelding/i, meaning: 'Cancellation of a tax or debt because your income is too low to pay it.', tip: 'Gemeenten and water boards often give it for local taxes. Many have an online form.' },
    { term: 'toeslag', slug: 'toeslag', pattern: /\btoeslag(?:en)?\b/i, meaning: 'Allowance. Money from the government to help with costs like health insurance, rent or childcare.' },
    { term: 'zorgtoeslag', slug: 'zorgtoeslag', pattern: /zorgtoeslag/i, meaning: 'Health care allowance. It helps pay your health insurance if your income is low.' },
    { term: 'huurtoeslag', slug: 'huurtoeslag', pattern: /huurtoeslag/i, meaning: 'Rent allowance. It helps pay your rent if your income is low.' },
    { term: 'terugvordering', slug: 'terugvordering', pattern: /terugvorder/i, meaning: 'Claim to pay money back, because you got too much.' },
    { term: 'BSN', slug: 'bsn', pattern: /\bBSN\b|burgerservicenummer/i, meaning: 'Citizen service number (burgerservicenummer). Your personal number for all government offices.', tip: 'Keep it private. Only give it to offices, your employer, your doctor, your insurer or your bank when they need it.' },
    { term: 'DigiD', slug: 'digid', pattern: /\bdigid\b/i, meaning: 'Your digital ID for logging in to government websites, like Mijn Belastingdienst or MijnOverheid.', tip: 'Never share your DigiD login, not even with someone who helps you. They can get permission to act for you (machtiging) instead.' },
    { term: 'MijnOverheid', slug: 'mijnoverheid', pattern: /mijn ?overheid/i, meaning: 'The government’s personal website. You see your data and your digital post (Berichtenbox) there.' },
    { term: 'Berichtenbox', slug: 'berichtenbox', pattern: /berichtenbox/i, meaning: 'Your digital mailbox in MijnOverheid. Offices can send official letters there instead of by post.', tip: 'Turn on email alerts, so you know when a new letter arrives. A letter there counts just like one on paper.' },
    { term: 'BRP', slug: 'brp', pattern: /\bBRP\b|basisregistratie personen/i, meaning: 'The national register of residents (Basisregistratie Personen). Your gemeente records your address in it.' },
    { term: 'inschrijving', slug: 'inschrijving', pattern: /inschrijving|ingeschreven/i, meaning: 'Registration, for example of your address in the BRP. When you first register, you get a BSN.' },
    { term: 'verblijfsvergunning', slug: 'verblijfsvergunning', pattern: /verblijfsvergunning/i, meaning: 'Residence permit. It lets you live in the Netherlands for a reason, like work, study or family.' },
    { term: 'IND', slug: 'ind', pattern: /\bIND\b|[Ii]mmigratie- en [Nn]aturalisatiedienst/, meaning: 'Immigration and Naturalisation Service. It decides on residence permits and Dutch citizenship.' },
    { term: 'UWV', slug: 'uwv', pattern: /\bUWV\b/, meaning: 'Employee insurance agency. It pays unemployment, sickness and disability benefits.' },
    { term: 'WW', slug: 'ww', pattern: /\bWW\b/, meaning: 'Unemployment benefit (Werkloosheidswet). You may get it for a while if you lose your job.' },
    { term: 'bijstand', slug: 'bijstand', pattern: /bijstand/i, meaning: 'Income support from your gemeente if you don’t have enough money to live on.' },
    { term: 'kinderbijslag', slug: 'kinderbijslag', pattern: /kinderbijslag/i, meaning: 'Child benefit. Money from the SVB to help with the costs of children under 18.' },
    { term: 'AOW', slug: 'aow', pattern: /\bAOW\b/, meaning: 'State pension. You build it up for each year you live or work in the Netherlands.' },
    { term: 'zorgverzekering', slug: 'zorgverzekering', pattern: /zorgverzekering|basisverzekering/i, meaning: 'Health insurance. Everyone who lives or works in the Netherlands must have basic health insurance (basisverzekering).' },
    { term: 'eigen risico', slug: 'eigen-risico', pattern: /eigen risico/i, meaning: 'The part of your care costs you pay yourself each year before the insurance pays. Visits to your GP don’t count.' },
    { term: 'OZB', slug: 'ozb', pattern: /\bOZB\b|onroerende ?-?zaakbelasting/i, meaning: 'Property tax (onroerendezaakbelasting). Owners of a home pay it to the gemeente.' },
    { term: 'afvalstoffenheffing', slug: 'afvalstoffenheffing', pattern: /afvalstoffenheffing/i, meaning: 'Waste tax. The gemeente charges it for collecting household rubbish. Tenants pay it too.' },
    { term: 'waterschapsbelasting', slug: 'waterschapsbelasting', pattern: /waterschapsbelasting|zuiveringsheffing|watersysteemheffing/i, meaning: 'Water board tax. It pays for dikes, water levels and cleaning waste water.' },
    { term: 'opzegtermijn', slug: 'opzegtermijn', pattern: /opzegtermijn/i, meaning: 'Notice period. The time between giving notice and the end of a contract.' },
    { term: 'borg', slug: 'borg', pattern: /\bborg(?:som)?\b|waarborgsom/i, meaning: 'Rental deposit. You get it back when you move out, minus costs for any damage.', tip: 'Since July 2023, the deposit for most rented homes can be at most 2 months of basic rent. Your landlord must usually return it within 14 days after you leave.' },
    { term: 'servicekosten', slug: 'servicekosten', pattern: /servicekosten/i, meaning: 'Service charges paid with the rent, for example for cleaning or lighting in shared areas.' },
    { term: 'jaarafrekening', slug: 'jaarafrekening', pattern: /jaarafrekening|jaarnota/i, meaning: 'Yearly bill. It compares what you used with the advance payments you made.' },
    { term: 'voorschot', slug: 'voorschot', pattern: /voorschot/i, meaning: 'Advance payment. Money paid before the final amount is known, for example for energy or a toeslag.' },
    { term: 'machtiging', slug: 'machtiging', pattern: /machtiging/i, meaning: 'Authorisation. Permission for someone to act for you, or for a company to take money from your account.' },
    { term: 'automatische incasso', slug: 'automatische-incasso', pattern: /automatische incasso|automatisch afgeschreven/i, meaning: 'Direct debit. They take the money from your bank account automatically.' },
    { term: 'betalingskenmerk', slug: 'betalingskenmerk', pattern: /betalingskenmerk/i, meaning: 'Payment reference. Type it in the payment reference field when you pay, exactly as written.' },
    { term: 'schuldhulpverlening', slug: 'schuldhulpverlening', pattern: /schuldhulp/i, meaning: 'Free debt help from your gemeente. They help you get an overview and make a plan with the people you owe.' },
    { term: 'Juridisch Loket', slug: 'juridisch-loket', pattern: /juridisch loket/i, meaning: 'Free legal advice service for people with a low or middle income.' },
  ],
  extraReplies: [
    {
      id: 'kwijtschelding',
      title: 'Ask to cancel a local tax (kwijtschelding)',
      advice: 'Use this if your income is low and you can’t pay a tax from your gemeente or water board. Many have an online form — use it if there is one. Add proof of your income, costs and bank balance.',
      english: 'I ask you to cancel the tax in your letter [date] ([amount]). My income is too low to pay it because [reason]. I attach proof of my income, my fixed costs and my bank balance.',
      subject: 'Betreft: Verzoek om kwijtschelding',
      body: (result) => [
        `Hierbij vraag ik kwijtschelding aan voor de aanslag ${letterOf(result)}, voor een bedrag van ${amountOf(result)}.`,
        'Mijn inkomen is te laag om dit bedrag te betalen, omdat [leg uit: uw inkomen, vaste lasten en gezinssituatie].',
        '',
        'Als bijlage stuur ik bewijsstukken mee van mijn inkomen, mijn vaste lasten en het saldo van mijn bankrekening(en).',
        '',
        'Graag ontvang ik uw beslissing.',
      ],
      when: (result) => result.kind?.type === 'tax-assessment' && ['gemeente', 'waterschap'].includes(result.sender?.id),
    },
    {
      id: 'dispute-debt',
      title: 'Ask for proof of the debt',
      advice: 'Use this if you don’t recognise the debt or the amount. Ask for proof before you pay, and keep a copy of your letter.',
      english: 'You asked me to pay [amount]. I don’t recognise this claim. Please send me within 14 days: the name of the original creditor, copies of the original bills, and how the amount is made up (debt, interest and costs). Please stop collecting until I have this.',
      subject: 'Betreft: Betwisting van de vordering',
      body: (result) => [
        `In uw brief ${letterOf(result)} vraagt u mij ${amountOf(result)} te betalen.`,
        'Ik herken deze vordering niet.',
        '',
        'Ik verzoek u mij binnen 14 dagen het volgende te sturen:',
        '- de naam van de oorspronkelijke schuldeiser;',
        '- kopieën van de oorspronkelijke facturen;',
        '- een overzicht van het bedrag: hoofdsom, rente en kosten.',
        '',
        'Ik verzoek u de incasso op te schorten totdat ik deze gegevens heb ontvangen.',
      ],
      when: (result) => ['incasso', 'deurwaarder'].includes(result.sender?.id),
    },
  ],
  samples: [
    {
      id: 'tax',
      title: 'Tax office',
      subtitle: 'Income tax bill with a deadline',
      build(today) {
        const letter = lastWorkday(addDays(today, -4));
        const due = addMonths(letter, 2);
        const year = Number(today.slice(0, 4)) - 1;
        return `Belastingdienst
Postbus 12345 · 7300 AB Apeldoorn

De heer S. Voorbeeld
Voorbeeldstraat 12
1075 AB Amsterdam

Dagtekening: ${dutchDate(letter)}
BSN: 999990019
Aanslagnummer: 9999.90.019.H.56.01

Aanslag inkomstenbelasting en premie volksverzekeringen ${year}

Geachte heer Voorbeeld,

Wij hebben uw aangifte inkomstenbelasting over ${year} verwerkt. Op dit aanslagbiljet ziet u hoeveel belasting u nog moet betalen.

Berekening
Inkomstenbelasting en premie volksverzekeringen: € 9.876,54
Ingehouden loonheffing: € 8.641,98
Te betalen bedrag: € 1.234,56

Wij moeten uw betaling uiterlijk ${dutchDate(due)} hebben ontvangen. Maak het bedrag over naar:
IBAN: NL91 ABNA 0417 1643 00
Ten name van: Belastingdienst
Betalingskenmerk: 9999 9001 9560 1234

Gebruik altijd het betalingskenmerk. Dan weten wij dat de betaling van u is.

Kunt u niet op tijd betalen? Vraag dan een betalingsregeling aan.

Bent u het niet eens met deze aanslag? Dan kunt u binnen zes weken na de dagtekening van deze aanslag bezwaar maken. Dat kan online in Mijn Belastingdienst of met een brief. Een bezwaar geeft u niet automatisch uitstel van betaling.

Met vriendelijke groet,

Belastingdienst`;
      },
    },
    {
      id: 'ind',
      title: 'Immigration service (IND)',
      subtitle: 'Appointment for photo and fingerprints',
      build(today) {
        const letter = lastWorkday(addDays(today, -1));
        const appointment = nextWorkday(addDays(today, 8));
        return `Immigratie- en Naturalisatiedienst
Postbus 12345 · 2500 AB Den Haag

Mevrouw P. Voorbeeld
Voorbeeldlaan 8
3511 AB Utrecht

Datum: ${dutchDate(letter)}
V-nummer: 3012345678
Ons kenmerk: 2026-0012345

Onderwerp: Uitnodiging voor het afnemen van biometrische gegevens

Geachte mevrouw Voorbeeld,

U heeft een aanvraag gedaan voor een verblijfsvergunning. Voor deze aanvraag hebben wij uw biometrische gegevens nodig: een pasfoto, uw vingerafdrukken en uw handtekening.

Wij nodigen u daarom uit op ${dutchDate(appointment)} om 09:30 uur bij het IND-loket Den Haag, Voorbeeldplein 1.

Neem mee:
- deze uitnodiging
- uw geldige paspoort

Kunt u niet komen? Maak dan zo snel mogelijk een nieuwe afspraak via ind.nl. Komt u niet en maakt u geen nieuwe afspraak? Dan kan dit gevolgen hebben voor uw aanvraag.

Met vriendelijke groet,

Immigratie- en Naturalisatiedienst`;
      },
    },
  ],
};
