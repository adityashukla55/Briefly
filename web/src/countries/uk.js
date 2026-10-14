import { addDays, addMonths, formatLocalDate, fromIso } from '../dates.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function dayDate(iso) {
  return `${DAYS[fromIso(iso).getUTCDay()]} ${longDate(iso)}`;
}

function ukDate(iso) {
  return formatLocalDate(iso, '/', 'dmy');
}

function letterOf(result) {
  return result.letterDate ? `dated ${ukDate(result.letterDate)}` : 'dated [DD/MM/YYYY]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: money.currency ?? 'GBP' }).format(money.amount) : '[amount]';
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default {
  id: 'uk',
  slug: 'united-kingdom',
  name: 'United Kingdom',
  inName: 'the United Kingdom',
  short: 'UK',
  adjective: 'British',
  flag: '🇬🇧',
  language: 'en',
  locale: 'en-GB',
  currency: 'GBP',
  decimal: '.',
  thousands: ',',
  dateSeparator: '/',
  dateOrder: 'dmy',
  ibanLength: 22,
  intro: 'In the UK, many deadlines count from the date printed on the letter, and some are very short — for example 14 days to answer a court claim. Rules can differ between England, Wales, Scotland and Northern Ireland, so always check the dates and instructions in your letter.',
  signals: [
    /\bHMRC\b|HM Revenue (?:and|&) Customs/i,
    /\bDWP\b|Department for Work and Pensions/i,
    /\bDVLA\b/,
    /gov\.uk\b/i,
    /£\s?\d/,
    /\bGBP\b/,
    /\bGB\d{2}\s?[A-Z]{4}/,
    /\bsort code\b/i,
    /\b[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}\b/,
    /\bNational Insurance\b/i,
    /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/,
    /council tax/i,
    /\bUniversal Credit\b|\bJobcentre\b/i,
    /\bYours (?:faithfully|sincerely)\b/i,
    /\b(?:England|Wales|Scotland|Northern Ireland|United Kingdom)\b/,
  ],
  deliveryDays: 2,
  deliveryNote: 'In the UK, a letter sent by first class post is usually treated as delivered on the second working day after it was posted. But many deadlines, for example for appeals, count from the date printed on the letter.',
  objectionAdvice: 'Use this if you think the decision is wrong. Check the letter first: many UK offices want their own form or an online request, and some want a review (for example a mandatory reconsideration) before an appeal. Send it before the deadline and keep proof of posting.',
  deadlineWords: ['by', 'within', 'no later than'],
  objectionDefault: 'appeal',
  localAccount(text) {
    const sortCode = text.match(/sort code\s*:?\s*(\d{2})[- ]?(\d{2})[- ]?(\d{2})\b/i);
    const pattern = /(?<!council tax |customer )\baccount (?:number|no\.?)\s*:?\s*(\d{8})\b/i;
    const account = text.slice(sortCode?.index ?? 0).match(pattern) ?? text.match(pattern);
    if (!sortCode || !account) return null;
    const code = sortCode.slice(1, 4).join('-');
    return { text: `sort code ${code}, account number ${account[1]}`, rows: [['Sort code', code], ['Account number', account[1]]] };
  },
  objection: [
    { word: 'mandatory reconsideration', pattern: /mandatory reconsideration/i },
    { word: 'administrative review', pattern: /administrative review/i },
    { word: 'representations', pattern: /\b(?:formal |informal )?representations?\b/i },
    { word: 'challenge', pattern: /\bchallenge/i },
    { word: 'appeal', pattern: /\bappeal/i },
    { word: 'dispute', pattern: /\bdispute/i },
    { word: 'review', pattern: /\breview\b/i },
  ],
  help: {
    debt: 'a free debt advice service such as Citizens Advice, StepChange or National Debtline',
    tenant: 'Shelter or Citizens Advice',
    instalments: 'payment arrangement',
    general: 'Citizens Advice (free, independent advice), or a law centre',
  },
  senders: [
    {
      id: 'hmrc',
      slug: 'hmrc',
      name: 'Tax office',
      local: 'HM Revenue and Customs (HMRC)',
      about: 'The UK tax office. It handles Income Tax, National Insurance, VAT, Child Benefit and tax credits.',
      patterns: [/\bHMRC\b/, /HM Revenue (?:and|&) Customs/i, /self assessment/i, /simple assessment/i, /\bP800\b/, /\bPAYE\b/, /\bUnique Taxpayer Reference\b|\bUTR\b/i, /\btax code\b/i, /\bChild Benefit\b/i, /\bBX9\s?\d[A-Z]{2}\b/],
      letters: ['P800 tax calculation — you paid too much or too little tax through your job or pension', 'Simple Assessment (PA302) — tax you owe, worked out by HMRC, with a date to pay', 'Self Assessment reminder or penalty — a tax return or payment is late', 'Tax code notice — the code your employer uses to take tax from your pay'],
      tips: ['HMRC never asks you to pay with gift cards or vouchers, and doesn’t threaten arrest by phone or text. If unsure, check the letter in your HMRC online account on GOV.UK.', 'If you can’t pay in full, you can often set up a Time to Pay arrangement online or by phone.'],
    },
    {
      id: 'dwp',
      slug: 'dwp',
      name: 'Benefits office',
      local: 'Department for Work and Pensions (DWP)',
      about: 'Pays most benefits, for example Universal Credit, Personal Independence Payment (PIP), State Pension and Employment and Support Allowance.',
      patterns: [/\bDWP\b/, /Department for Work and Pensions/i, /\bUniversal Credit\b/i, /Personal Independence Payment|\bPIP\b/i, /\bJobcentre(?: Plus)?\b/i, /State Pension/i, /Employment and Support Allowance|\bESA\b/, /Debt Management/i, /work coach/i],
      letters: ['Decision letter — what you get, or why your benefit changes or stops', 'Appointment letter — you must go to the Jobcentre or an assessment', 'Overpayment letter — they say they paid you too much and want it back', 'Mandatory reconsideration notice — the result of their review'],
      tips: ['If you disagree with a decision, first ask for a mandatory reconsideration within one month of the date on the decision letter. After that you can appeal to a tribunal.', 'For Universal Credit, many messages arrive in your online journal, not by post. Check it often.'],
    },
    {
      id: 'council',
      slug: 'local-council',
      name: 'Local council',
      local: 'Council (borough, district or city council)',
      about: 'Your local council. It collects council tax, deals with housing benefit and council tax support, and gives out many parking tickets.',
      patterns: [/\b(?:borough|district|city|county) council\b/i, /\bcouncil tax\b/i, /\bcouncil\b/i, /housing benefit/i, /council tax (?:reduction|support)/i, /\bliability order\b/i, /\bPenalty Charge Notice\b|\bPCN\b/i, /\brevenues (?:and benefits|team)\b/i],
      letters: ['Council tax bill — what you pay for the year, usually in 10 monthly instalments', 'Reminder or final notice — a payment is late; if you don’t catch up, the whole year can become due', 'Summons — they ask the magistrates’ court for a liability order to collect unpaid council tax', 'Penalty Charge Notice (PCN) — a parking or traffic fine'],
      tips: ['If your income is low, ask about Council Tax Reduction. If you live alone as an adult, you can usually get a 25% single person discount.', 'Talk to the council early if you can’t pay. A new payment plan is easier to get before a summons.'],
    },
    {
      id: 'dvla',
      slug: 'dvla',
      name: 'Driver and vehicle office',
      local: 'Driver and Vehicle Licensing Agency (DVLA)',
      about: 'Deals with driving licences, vehicle tax and the vehicle logbook (V5C).',
      patterns: [/\bDVLA\b/, /Driver and Vehicle Licensing Agency/i, /\bV5C\b/, /\bSORN\b/, /vehicle tax/i, /driving licen[cs]e/i, /\bSwansea\s+SA\d/i],
      letters: ['Vehicle tax reminder — your car tax runs out soon', 'Letter about an untaxed vehicle — pay the fine or tax the vehicle', 'Driving licence letter — renewal, medical questions or a change'],
      tips: ['Tax your vehicle or declare it off the road (SORN) — an untaxed car on a public road can be fined or clamped.', 'Use only GOV.UK for vehicle tax and licences. Other websites may charge extra.'],
    },
    {
      id: 'tv-licensing',
      slug: 'tv-licensing',
      name: 'TV licence office',
      local: 'TV Licensing',
      about: 'Collects the TV licence fee for the BBC. You need a licence to watch or record live TV on any channel, or to use BBC iPlayer.',
      patterns: [/TV Licensing/i, /TV Licen[cs]e/i, /\bBBC iPlayer\b/i, /licen[cs]e fee/i],
      letters: ['Renewal reminder — your licence runs out soon', 'Letter to an unlicensed address — they think you need a licence', 'Payment reminder — a payment for your licence is missing'],
      tips: ['If you don’t watch live TV or BBC iPlayer, you don’t need a licence. You can tell TV Licensing online so the letters stop.', 'People aged 75 or over who get Pension Credit can get a free licence.'],
    },
    {
      id: 'home-office',
      slug: 'home-office',
      name: 'Immigration office',
      local: 'Home Office / UK Visas and Immigration (UKVI)',
      about: 'Decides on visas, settlement (indefinite leave to remain) and citizenship applications.',
      patterns: [/\bHome Office\b/i, /UK Visas and Immigration|\bUKVI\b/i, /\beVisa\b/i, /leave to remain/i, /\bbiometric/i, /\bGWF\d+/, /Unique Application Number|\bUAN\b/i, /\bBRP\b|biometric residence permit/i, /\bUKVCAS\b/i],
      letters: ['Decision letter — your visa or status was granted or refused', 'Request for more information — they need more documents before they decide', 'Biometrics or interview letter — you must give fingerprints and a photo, or come to an interview', 'eVisa letter — about your digital immigration status'],
      tips: ['Deadlines to challenge a refusal are short — often 14 days. Get advice from a regulated immigration adviser right away.', 'Keep your contact details up to date in your UKVI account, and check that your eVisa details are correct.'],
    },
    {
      id: 'court',
      slug: 'court',
      name: 'Court or tribunal',
      local: 'County Court / Magistrates’ Court / Tribunal (HMCTS)',
      about: 'A court or tribunal. Court papers are always important — never ignore them.',
      patterns: [/\bCounty Court\b/i, /Magistrates[’']? Court/i, /\btribunal\b/i, /\bHMCTS\b|HM Courts (?:and|&) Tribunals/i, /Civil National Business Centre|\bCNBC\b/i, /Money Claim/i, /\bclaim form\b/i, /\bclaimant\b/i, /\bdefendant\b/i, /Single Justice Procedure/i, /\bCCJ\b|county court judgment/i],
      letters: ['Claim form — someone is taking you to court for money', 'Single Justice Procedure notice — you are charged with a minor offence, for example no TV licence or speeding', 'Hearing notice — you must come to court or a tribunal on a set date', 'Judgment (CCJ) — the court’s decision that you must pay'],
      tips: ['Court deadlines are strict. If you don’t answer a claim in time, the claimant can get a judgment against you without a hearing.', 'Get free help early, for example from Citizens Advice, a law centre or Support Through Court.'],
    },
    {
      id: 'enforcement-agent',
      slug: 'enforcement-agents',
      name: 'Bailiffs',
      local: 'Enforcement agents (bailiffs)',
      about: 'Collect debts after a court order, for example for council tax, parking fines or a CCJ. They can add fees and, in some cases, take goods.',
      patterns: [/enforcement agents?/i, /\bbailiffs?\b/i, /notice of enforcement/i, /High Court Enforcement/i, /\bwrit of control\b/i, /controlled goods agreement/i, /compliance (?:stage|fee)/i],
      letters: ['Notice of enforcement — you have at least 7 clear days to pay before they can visit', 'Letter after a visit — what they took, or the fees they added', 'Controlled goods agreement — a payment plan where your goods are listed as security'],
      tips: ['Act fast: fees go up at each stage. Call them, offer what you can pay and ask for a plan. Get free debt advice the same day.', 'Bailiffs usually can’t force their way into your home for these debts. You don’t have to let them in — but don’t ignore them.'],
    },
    {
      id: 'debt-collector',
      slug: 'debt-collector',
      name: 'Debt collector',
      local: 'Debt collection agency',
      about: 'A company that collects debts for others, or that bought an old debt. Check that the debt is really yours and the amount is right before you pay.',
      patterns: [/debt collect/i, /collection agency/i, /debt recovery/i, /letter (?:before|of) (?:action|claim)/i, /\boriginal creditor\b/i, /\bcreditor\b/i, /\bdefault notice\b/i, /\bassigned to us\b/i, /reply form/i],
      letters: ['Notice of assignment — your debt was sold to a new company', 'Letter of claim (letter before action) — they plan to go to court; you usually have 30 days to reply', 'Settlement offer — they accept less than the full amount'],
      tips: ['Ask for proof if you don’t recognise the debt, for example a copy of the credit agreement and a statement of account.', 'Most debts can’t be taken to court after 6 years without payment or written acknowledgement (5 years in Scotland). Get advice before you pay an old debt.'],
    },
    {
      id: 'police',
      slug: 'police-speeding',
      name: 'Police (speeding and driving)',
      local: 'Police / Safety Camera Partnership',
      about: 'Sends letters about speeding, red lights and other driving offences caught by cameras or officers.',
      patterns: [/Notice of Intended Prosecution|\bNIP\b/i, /section 172/i, /safety camera/i, /\bconstabulary\b/i, /police (?:force|service)/i, /speed awareness/i, /fixed penalty/i, /conditional offer/i, /camera (?:enforcement|detected)/i],
      letters: ['Notice of Intended Prosecution with a Section 172 request — say who was driving, within 28 days', 'Conditional offer of a fixed penalty — pay the fine and take points on your licence', 'Offer of a speed awareness course — a course instead of points'],
      tips: ['Always name the driver within 28 days, even if you plan to fight it. Not answering is a separate offence with 6 penalty points.', 'Use only the website or address printed on the letter. Texts and emails asking for speeding fines are often scams.'],
    },
    {
      id: 'private-parking',
      slug: 'private-parking',
      name: 'Private parking company',
      local: 'Private parking operator',
      about: 'Companies that run car parks for shops, hospitals and landlords. Their Parking Charge Notice is a bill under a contract, not a fine from the police or council.',
      patterns: [/parking charge notice/i, /parking (?:operator|company|eye|services)/i, /\bPOPLA\b/, /Independent Appeals Service|\bIAS\b/, /British Parking Association|\bBPA\b/, /International Parking Community|\bIPC\b/, /\bANPR\b/],
      letters: ['Parking Charge Notice — they say you broke the car park rules; often reduced if paid within 14 days', 'Reminder or debt collection letter — the charge went up because it wasn’t paid', 'Letter of claim — they plan to take you to court'],
      tips: ['You can appeal to the parking company first, and then to an independent service (POPLA or the IAS). Keep photos, receipts and your ticket.', 'Don’t ignore court papers about a parking charge — a CCJ is much worse than the charge.'],
    },
    {
      id: 'energy',
      slug: 'energy-supplier',
      name: 'Gas or electricity supplier',
      local: 'Energy supplier',
      about: 'The company that sells you gas or electricity.',
      patterns: [/energy supplier/i, /\belectricity\b/i, /\bgas (?:and electricity|supply|bill|account)\b/i, /\bkWh\b/i, /meter reading/i, /prepayment meter/i, /\bOfgem\b/i, /Energy Ombudsman/i, /standing charge/i],
      letters: ['Bill or annual statement — what you used and what you owe', 'Final demand — an unpaid bill; they may add costs or ask to fit a prepayment meter', 'Change to your tariff or Direct Debit — your price or monthly payment changes'],
      tips: ['If you can’t pay, call them and ask for an affordable payment plan. Suppliers must take your situation into account.', 'If a complaint isn’t solved after 8 weeks, you can go to the Energy Ombudsman for free.'],
    },
    {
      id: 'water',
      slug: 'water-company',
      name: 'Water company',
      local: 'Water company',
      about: 'Supplies water and takes away waste water. Water companies can’t cut off water to homes for unpaid bills.',
      patterns: [/\bwater (?:company|services|bill|charges|rates)\b/i, /\bsewerage\b/i, /\bwastewater\b/i, /\bWaterSure\b/i, /\bwater meter\b/i, /social tariff/i],
      letters: ['Water bill — charges for the year or half year', 'Reminder — a payment is late', 'Meter letter — about a new or changed water meter'],
      tips: ['If money is tight, ask about a social tariff or WaterSure. They can lower your bill.', 'Unpaid water bills can still go to debt collectors or court, so ask for a plan early.'],
    },
    {
      id: 'landlord',
      slug: 'landlord',
      name: 'Landlord or letting agent',
      local: 'Landlord / letting agent',
      about: 'The owner of your home, or the agency that manages it.',
      patterns: [/\blandlord\b/i, /letting agen(?:t|cy)/i, /\btenan(?:t|cy)\b/i, /section (?:21|8|13)\b/i, /\brent arrears\b/i, /deposit (?:protection|scheme)/i, /possession (?:order|claim|proceedings)/i, /notice (?:to quit|seeking possession)/i],
      letters: ['Notice seeking possession — your landlord wants you to leave; it must give a reason and a date', 'Rent increase notice — your rent will go up', 'Rent arrears letter — you are behind with rent'],
      tips: ['Only a court can make you leave your home. A landlord who changes the locks or removes your things without a court order is usually breaking the law.', 'Eviction rules changed in England in 2026 and are different in Wales, Scotland and Northern Ireland. Get advice from Shelter or Citizens Advice before you move out.'],
    },
    {
      id: 'nhs',
      slug: 'nhs',
      name: 'Health service',
      local: 'NHS',
      about: 'The National Health Service. It sends appointment letters, test results and, in some cases, bills or penalty charges.',
      patterns: [/\bNHS\b/, /\bhospital\b/i, /\bGP (?:surgery|practice)\b/i, /outpatient/i, /NHS Business Services Authority|\bNHSBSA\b/i, /prescription (?:charge|exemption)/i, /overseas visitor/i],
      letters: ['Appointment letter — date, time and place of a hospital or clinic appointment', 'Penalty charge — they say you claimed free prescriptions or dental care without the right to it', 'Invoice for treatment — for some people who aren’t ordinarily resident in the UK'],
      tips: ['If you can’t go to an appointment, tell them as soon as possible so someone else can have it.', 'If you got a penalty charge but you did have the right to free care, you can challenge it with proof.'],
    },
    {
      id: 'student-loans',
      slug: 'student-loans-company',
      name: 'Student loan office',
      local: 'Student Loans Company (SLC)',
      about: 'Pays student finance and collects repayments, usually through your salary once you earn enough.',
      patterns: [/Student Loans Company|\bSLC\b/i, /student finance/i, /student loan/i, /repayment threshold/i, /overseas income assessment/i],
      letters: ['Annual statement — your balance and interest', 'Overseas assessment — if you live abroad, you must tell them your income', 'Arrears letter — a repayment was missed'],
      tips: ['If you move abroad, tell the Student Loans Company. If you don’t, they can set high fixed repayments.', 'Repayments usually depend on what you earn, not on what you owe.'],
    },
  ],
  kinds: [
    {
      id: 'enforcement', type: 'enforcement', local: 'Notice of enforcement (bailiffs)', name: 'Enforcement notice', about: 'Enforcement agents (bailiffs) will collect the debt. They add fees at each stage, and can visit your home.', urgency: 'high', objection: false, patterns: [/notice of enforcement/i, /enforcement agents?/i, /\bbailiffs?\b/i, /writ of control/i, /High Court Enforcement/i, /controlled goods/i],
      steps: ['Call them today. Offer an amount you can really pay each month and ask them to put the case on hold. Fees grow at each stage.', 'If you are vulnerable — for example ill, disabled or caring for young children — tell them. They must take it into account.'],
    },
    {
      id: 'claim-form', type: 'court-order', local: 'County Court claim form', name: 'Court claim against you', about: 'Someone is taking you to court for money. You must answer within 14 days, or the court can decide against you without a hearing.', urgency: 'high', objection: false, extendable: false, patterns: [/\bclaim form\b/i, /\bN1\b/, /Money Claim/i, /response pack/i, /acknowledg(?:e)?ment of service/i, /\bclaimant\b/i, /Civil National Business Centre|\bCNBC\b/i],
      steps: ['Answer within 14 days after the claim was served (usually the second working day after it was posted). If you need more time, file an acknowledgment of service — you then get 28 days in total.', 'If you agree you owe the money, you can offer to pay in instalments on the admission form. If you ignore it, you can get a County Court Judgment (CCJ), which hurts your credit rating for 6 years.'],
    },
    {
      id: 'single-justice', type: 'court-order', local: 'Single Justice Procedure notice', name: 'Charge for a minor offence', about: 'You are charged with a minor offence, for example no TV licence, speeding or not paying a train fare. A magistrate decides on paper unless you ask for a hearing.', urgency: 'high', objection: false, extendable: false, instalments: false, patterns: [/Single Justice Procedure/i, /\bSJP\b/, /plead (?:guilty|not guilty)/i],
      steps: ['Answer within 21 days: plead guilty or not guilty, online or on the form. If you do nothing, the case is decided without you.', 'Tell the court about your income — the fine depends on it. Get free advice if you are not sure what to plead.'],
    },
    {
      id: 'reminder', type: 'reminder', local: 'Reminder / final notice', name: 'Payment reminder', about: 'A payment is late. If you don’t pay, the next step is often court action or losing the right to pay in instalments.', urgency: 'high', patterns: [/\breminder\b/i, /final (?:notice|demand|reminder)/i, /\boverdue\b/i, /\barrears\b/i, /\boutstanding (?:balance|amount)\b/i, /you have not paid/i, /payment is (?:late|overdue)/i],
      steps: ['For council tax: if you pay the missed amount within 7 days, you can usually keep paying in instalments. If not, the rest of the year’s bill can become due at once.'],
    },
    {
      id: 'letter-of-claim', type: 'reminder', local: 'Letter of claim / letter before action', name: 'Warning before court', about: 'They say they will take you to court if you don’t pay or reply. For debts, you usually have 30 days to reply with the reply form.', urgency: 'high', patterns: [/letter (?:before|of) (?:action|claim)/i, /pre-action protocol/i, /reply form/i, /court (?:action|proceedings) (?:may|will) (?:be|start)/i],
      steps: ['Reply within 30 days. Use the reply form: say if you agree you owe it, want to pay in instalments, or dispute it. There is a ready-made letter below.', 'Get free debt advice before you reply — for example from Citizens Advice, StepChange or National Debtline.'],
    },
    {
      id: 'overpayment', type: 'repayment', local: 'Overpayment letter', name: 'Request to pay money back', about: 'They say they paid you too much, for example Universal Credit, housing benefit or tax credits, and want the money back.', urgency: 'high', patterns: [/\boverpa(?:id|yment)\b/i, /recover(?:y of)? (?:the )?overpayment/i, /pay (?:this|it|the money) back/i],
      steps: ['Check how they worked it out. If you think it’s wrong, ask for a mandatory reconsideration (for benefits) within one month.', 'If repayments leave you short of money, ask them to lower the monthly amount or to waive the debt because of hardship.'],
    },
    {
      id: 'pcn', type: 'fine', local: 'Penalty Charge Notice (PCN)', name: 'Parking or traffic fine (council)', about: 'A fine from the council for parking, a bus lane or a traffic rule. Paying within 14 days usually halves it.', urgency: 'high', patterns: [/Penalty Charge Notice/i, /\bPCN\b/, /contravention/i, /notice to owner/i, /charge certificate/i, /bus lane/i, /discount(?:ed)? (?:rate|amount|period)/i],
      steps: ['To challenge it, write to the council within the discount period (usually 14 days) — the discount is often kept while they look at it. There is a ready-made letter below.', 'If you ignore it, a Notice to Owner and then a Charge Certificate follow, and the fine goes up by 50%.'],
    },
    {
      id: 'private-parking', type: 'fine', local: 'Parking Charge Notice (private)', name: 'Private parking charge', about: 'A private car park company says you broke its rules. It’s a bill under a contract, not a fine — but it can end in court if you ignore it.', urgency: 'medium', patterns: [/parking charge notice/i, /\bPOPLA\b/, /Independent Appeals Service/i, /terms and conditions of (?:the )?(?:car park|parking)/i, /\bANPR\b/i],
      steps: ['If you think it’s unfair, appeal to the company within the time on the notice (often 28 days), then to POPLA or the IAS if they say no.', 'Don’t ignore later court papers. Answer them in time.'],
    },
    {
      id: 'nip', type: 'documents', local: 'Notice of Intended Prosecution (NIP)', name: 'Speeding notice — name the driver', about: 'A camera or officer caught a vehicle speeding or running a red light. The keeper must say who was driving within 28 days.', urgency: 'high', objection: false, extendable: false, instalments: false, patterns: [/Notice of Intended Prosecution/i, /\bNIP\b/, /section 172/i, /driver (?:details|identification|nomination)/i, /who was driving/i],
      steps: ['Fill in who was driving and send it back within 28 days — even if you weren’t driving or want to fight it. Not answering is a separate offence with 6 points and a fine.', 'After that, you may get an offer of a speed awareness course or a fixed penalty (a fine and 3 points), or a court summons.'],
    },
    {
      id: 'hmrc-penalty', type: 'fine', local: 'Penalty notice (HMRC)', name: 'Tax penalty', about: 'A penalty for a late tax return or late payment. You can appeal within 30 days if you had a good reason.', urgency: 'medium', patterns: [/late filing penalty/i, /late payment penalty/i, /penalty notice/i, /we(?:’|')ve charged you a penalty/i, /reasonable excuse/i],
      steps: ['If you had a reasonable excuse, for example a serious illness, appeal within 30 days of the date on the penalty notice — online or by post.', 'File the missing tax return as soon as possible. Penalties grow the longer it is late.'],
    },
    {
      id: 'tax-calculation', type: 'tax-assessment', local: 'P800 / Simple Assessment', name: 'Tax calculation', about: 'HMRC worked out your tax for a year. It shows if you paid too much (a refund) or too little (tax to pay).', urgency: 'medium', patterns: [/\bP800\b/, /simple assessment/i, /\bPA302\b/, /tax calculation/i, /you (?:have )?paid too (?:much|little) tax/i, /not paid enough (?:Income )?tax/i, /tax year \d{4} to \d{4}/i, /6 April \d{4} to 5 April \d{4}/i],
      steps: ['Compare the figures with your P60, payslips and pension statements. If something is wrong, contact HMRC within the time in the letter — for Simple Assessment, 60 days.', 'If you owe tax and can’t pay it all, ask for a Time to Pay arrangement. Small amounts may be collected through your tax code instead.'],
    },
    {
      id: 'benefit-decision', type: 'decision', local: 'Decision letter (benefits)', name: 'Benefit decision', about: 'A decision about your benefit — for example what you get, a change, a sanction or that it stops.', urgency: 'medium', patterns: [/decision (?:letter|notice)/i, /we have (?:decided|made a decision)/i, /your (?:award|entitlement)/i, /\bsanction/i],
      steps: ['If you disagree, ask for a mandatory reconsideration within one month of the date on the letter. After that, you can appeal to an independent tribunal.'],
    },
    {
      id: 'refusal', type: 'rejection', local: 'Refusal letter', name: 'Refusal', about: 'Your application was refused. The letter says if you can challenge it, how and by when.', urgency: 'medium', patterns: [/\brefus(?:al|ed)\b/i, /has been (?:refused|rejected|turned down)/i, /we cannot (?:accept|approve)/i, /not been successful/i],
      steps: ['Look for the part about your right to a review or appeal. For immigration refusals the time limit is often only 14 days — get advice from a regulated adviser now.'],
    },
    { id: 'approval', type: 'approval', local: 'Approval / grant letter', name: 'Approval', about: 'Your application was approved. Check that names, dates and amounts are right.', urgency: 'low', patterns: [/has been (?:approved|granted)/i, /we are pleased to (?:tell|inform) you/i, /\bgranted\b/i, /your award/i] },
    {
      id: 'appointment', type: 'appointment', local: 'Appointment letter', name: 'Appointment', about: 'They want you to come to an appointment, for example at the Jobcentre, an assessment, an interview or a hospital. Missing it can delay or reduce your benefits or case.', urgency: 'medium', patterns: [/\bappointment\b/i, /you must (?:attend|come to)/i, /please (?:attend|come to)/i, /\binterview\b/i, /assessment (?:centre|appointment)/i, /biometric enrolment/i],
      steps: ['For Jobcentre appointments: if you can’t go, tell your work coach before the appointment, for example in your Universal Credit journal. Missing it without a good reason can lead to a sanction.'],
    },
    {
      id: 'eviction', type: 'termination', local: 'Notice seeking possession / notice to quit', name: 'Eviction notice', about: 'Your landlord wants you to leave. The notice must follow strict rules — many notices are not valid.', urgency: 'high', objection: false, patterns: [/notice seeking possession/i, /notice to quit/i, /section (?:21|8)\b/i, /possession (?:order|claim|proceedings)/i, /\bevict/i, /leave the property/i],
      steps: ['Don’t move out because of the notice alone. Only a court can order you to leave, and the notice may not be valid.', 'Get free advice today, for example from Shelter or Citizens Advice. Rules differ between England, Wales, Scotland and Northern Ireland.'],
    },
    {
      id: 'council-tax-bill', type: 'fee-decision', local: 'Council tax bill', name: 'Council tax bill', about: 'Your council tax for the year, based on your home’s band. It is usually paid in 10 monthly instalments.', urgency: 'low', patterns: [/council tax (?:bill|demand notice)/i, /demand notice/i, /council tax band/i, /\bband [A-I]\b/, /annual (?:council tax )?charge/i],
      steps: ['Check the band and any discounts, for example the 25% single person discount or Council Tax Reduction if your income is low.'],
    },
    {
      id: 'utility-bill', type: 'utility-bill', local: 'Energy or water bill', name: 'Energy or water bill', about: 'A bill for gas, electricity or water. It shows what you used and when to pay.', urgency: 'medium', patterns: [/\bkWh\b/i, /meter reading/i, /standing charge/i, /\bunit rate\b/i, /water (?:and sewerage )?charges/i, /annual statement/i],
      steps: ['Check that the meter readings are right. If the bill uses an estimate, send a real reading.'],
    },
    { id: 'bill', type: 'bill', local: 'Bill / statement', name: 'Bill', about: 'A bill or account statement. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bbill\b/i, /\bstatement\b/i, /\binvoice\b/i, /amount due/i, /\bdue date\b/i, /balance to pay/i] },
  ],
  references: [
    { name: 'Reference number', local: 'Our reference', pattern: /(?:\bour ref(?:erence)?(?: number)?|\breference (?:number|no\.?))/gi },
    { name: 'Claim number', local: 'Claim number', pattern: /\bclaim (?:number|no\.?)/gi },
    { name: 'PCN number', local: 'PCN number', pattern: /(?:\bPCN (?:number|no\.?)|\bpenalty charge (?:notice )?(?:number|no\.?))/gi },
    { name: 'Home Office reference', local: 'Home Office reference', pattern: /(?:\bHome Office reference(?: number)?|\bGWF (?:number|reference)|\bUnique Application Number|\bUAN\b)/gi },
    { name: 'Unique Taxpayer Reference', local: 'UTR', pattern: /(?:\bUnique Taxpayer Reference(?: \(UTR\))?|\bUTR\b)/gi },
    { name: 'Account number', local: 'Account number', pattern: /(?:\bcouncil tax account (?:number|no\.?)|\bcustomer (?:number|reference)|\baccount reference)/gi },
    { name: 'Vehicle registration', local: 'Vehicle registration', pattern: /(?:\bvehicle registration(?: (?:mark|number))?|\bregistration (?:mark|number)|\bVRM\b)/gi },
    { name: 'National Insurance number', local: 'National Insurance number', personal: true, pattern: /(?:\bNational Insurance (?:number|no\.?)|\bNI (?:number|no\.?)|\bNINO\b)/gi },
    { name: 'Payment reference', local: 'Payment reference', payment: true, pattern: /\bpayment reference(?: number)?/gi },
  ],
  glossary: [
    { term: 'HMRC', slug: 'hmrc', pattern: /\bHMRC\b/, meaning: 'HM Revenue and Customs. The UK tax office.' },
    { term: 'Self Assessment', slug: 'self-assessment', pattern: /self assessment/i, meaning: 'The yearly tax return some people must send to HMRC, for example the self-employed. The online deadline is usually 31 January.', tip: 'Late returns get a £100 penalty, and more the longer it is late.' },
    { term: 'Simple Assessment', slug: 'simple-assessment', pattern: /simple assessment/i, meaning: 'A tax bill that HMRC works out for you, without a tax return. You can query it within 60 days.' },
    { term: 'P800', slug: 'p800', pattern: /\bP800\b/, meaning: 'A tax calculation letter. It says if you paid too much or too little tax through your job or pension.' },
    { term: 'UTR', slug: 'utr', pattern: /\bUTR\b|Unique Taxpayer Reference/i, meaning: 'Unique Taxpayer Reference. A 10-digit number HMRC gives you for Self Assessment.' },
    { term: 'tax code', slug: 'tax-code', pattern: /\btax code\b/i, meaning: 'A code like 1257L. Your employer or pension uses it to work out how much tax to take from your pay.', tip: 'A wrong tax code means you pay too much or too little. Check it in your HMRC online account.' },
    { term: 'PAYE', slug: 'paye', pattern: /\bPAYE\b/, meaning: 'Pay As You Earn. Tax and National Insurance taken from your pay or pension by your employer.' },
    { term: 'Time to Pay arrangement', slug: 'time-to-pay', pattern: /time to pay/i, meaning: 'A payment plan with HMRC to pay tax you owe in monthly parts.', tip: 'For smaller Self Assessment debts you can often set it up online without calling.' },
    { term: 'National Insurance number', slug: 'national-insurance-number', pattern: /National Insurance (?:number|no)|\bNINO\b/i, meaning: 'Your personal number for tax and benefits, like QQ 12 34 56 C.', tip: 'Give it only to employers, HMRC, DWP and other official bodies.' },
    { term: 'Universal Credit', slug: 'universal-credit', pattern: /universal credit/i, meaning: 'The main monthly benefit for people of working age with low income or out of work. It is managed in an online account with a journal.' },
    { term: 'PIP', slug: 'pip', pattern: /\bPIP\b|personal independence payment/i, meaning: 'Personal Independence Payment. Money for extra costs if you have a long-term illness or disability.' },
    { term: 'mandatory reconsideration', slug: 'mandatory-reconsideration', pattern: /mandatory reconsideration/i, meaning: 'Asking the DWP or HMRC to look at a benefit decision again. You must do this before you can appeal to a tribunal.', tip: 'Ask within one month of the date on the decision letter. You can ask later with a good reason, up to 13 months.' },
    { term: 'sanction', slug: 'sanction', pattern: /\bsanction/i, meaning: 'A cut in your benefit, for example because you missed an appointment without a good reason.', tip: 'If you had a good reason, ask for a mandatory reconsideration. If you have no money for food or bills, ask about a hardship payment.' },
    { term: 'overpayment', slug: 'overpayment', pattern: /\boverpa(?:id|yment)/i, meaning: 'Money paid to you by mistake that they want back.', tip: 'Check how they worked it out. If repayments are too high, ask them to lower the amount.' },
    { term: 'work coach', slug: 'work-coach', pattern: /work coach/i, meaning: 'Your contact person at the Jobcentre for Universal Credit and job search.' },
    { term: 'journal', slug: 'journal', pattern: /\bjournal\b/i, meaning: 'The message area in your Universal Credit online account. Many messages and appointments appear there.' },
    { term: 'council tax', slug: 'council-tax', pattern: /council tax/i, meaning: 'A yearly tax for your home, paid to your local council. The amount depends on the band of your home.' },
    { term: 'council tax band', slug: 'council-tax-band', pattern: /council tax band|\bband [A-I]\b/i, meaning: 'The group (A to H, or A to I in Wales) your home is in, based on its value. It sets your council tax.', tip: 'If you think your band is too high, you can challenge it with the Valuation Office Agency (or the Scottish Assessors).' },
    { term: 'single person discount', slug: 'single-person-discount', pattern: /single person discount/i, meaning: '25% off council tax if you are the only adult living in your home.' },
    { term: 'Council Tax Reduction', slug: 'council-tax-reduction', pattern: /council tax (?:reduction|support)/i, meaning: 'Help from your council to pay council tax if your income is low.' },
    { term: 'liability order', slug: 'liability-order', pattern: /liability order/i, meaning: 'A court order that lets the council collect unpaid council tax, for example through bailiffs or from your wages or benefits.' },
    { term: 'enforcement agent', slug: 'enforcement-agent', pattern: /enforcement agents?|\bbailiffs?\b/i, meaning: 'A bailiff. Someone allowed to collect a debt after a court order, and who can add fees.', tip: 'Ask for a payment plan straight away, and tell them if you are vulnerable.' },
    { term: 'notice of enforcement', slug: 'notice-of-enforcement', pattern: /notice of enforcement/i, meaning: 'The first letter from bailiffs. You have at least 7 clear days to pay before they can visit.' },
    { term: 'CCJ', slug: 'ccj', pattern: /\bCCJ\b|county court judgment/i, meaning: 'County Court Judgment. A court order that you must pay a debt. It stays on your credit file for 6 years.', tip: 'If you pay in full within one month, it is removed from the register.' },
    { term: 'claim form', slug: 'claim-form', pattern: /claim form/i, meaning: 'The court paper that starts a case against you for money.', tip: 'Answer within 14 days after it was served. Get free help straight away.' },
    { term: 'acknowledgment of service', slug: 'acknowledgment-of-service', pattern: /acknowledg(?:e)?ment of service/i, meaning: 'A form that tells the court you got the claim and will defend it. It gives you 28 days in total to send your defence.' },
    { term: 'default judgment', slug: 'default-judgment', pattern: /default judg(?:e)?ment/i, meaning: 'A judgment made against you because you didn’t answer a claim in time.' },
    { term: 'Single Justice Procedure', slug: 'single-justice-procedure', pattern: /Single Justice Procedure/i, meaning: 'A quick way for a magistrate to decide minor offences on paper, without a hearing.', tip: 'Answer within 21 days. Tell the court about your income — the fine depends on it.' },
    { term: 'letter of claim', slug: 'letter-of-claim', pattern: /letter (?:of claim|before action)/i, meaning: 'A warning letter before a court case. For debts you usually have 30 days to reply.' },
    { term: 'statute-barred', slug: 'statute-barred', pattern: /statute[- ]barred|limitation (?:act|period)/i, meaning: 'A debt too old to take to court — usually 6 years after the last payment or written acknowledgement (5 years in Scotland).' },
    { term: 'arrears', slug: 'arrears', pattern: /\barrears\b/i, meaning: 'Money you owe because regular payments were missed, for example rent or council tax.' },
    { term: 'final demand', slug: 'final-demand', pattern: /final demand/i, meaning: 'The last reminder before they take further action, for example court or a debt collector.' },
    { term: 'PCN', slug: 'pcn', pattern: /\bPCN\b|Penalty Charge Notice/i, meaning: 'Penalty Charge Notice. A fine from a council (or Transport for London) for parking or traffic rules.', tip: 'Paying within 14 days usually halves it. You can challenge it first — the discount is often kept while they look at it.' },
    { term: 'Notice to Owner', slug: 'notice-to-owner', pattern: /notice to owner/i, meaning: 'The next letter after an unpaid PCN, sent to the registered keeper. You can make formal representations within 28 days.' },
    { term: 'charge certificate', slug: 'charge-certificate', pattern: /charge certificate/i, meaning: 'Sent when a PCN wasn’t paid or challenged in time. The fine goes up by 50%.' },
    { term: 'formal representations', slug: 'formal-representations', pattern: /formal representations?/i, meaning: 'A written challenge to a PCN after a Notice to Owner. If refused, you can appeal to an independent tribunal.' },
    { term: 'Parking Charge Notice', slug: 'parking-charge-notice', pattern: /parking charge notice/i, meaning: 'A bill from a private parking company, not a fine from the council or police.', tip: 'Appeal to the company first, then to POPLA or the IAS. Keep your ticket and photos.' },
    { term: 'POPLA', slug: 'popla', pattern: /\bPOPLA\b/, meaning: 'Parking on Private Land Appeals. A free, independent appeal service for many private parking charges.' },
    { term: 'NIP', slug: 'nip', pattern: /\bNIP\b|Notice of Intended Prosecution/i, meaning: 'Notice of Intended Prosecution. A letter that a vehicle was caught speeding or breaking a traffic rule.' },
    { term: 'Section 172 notice', slug: 'section-172', pattern: /section 172/i, meaning: 'The part of a speeding letter that asks the keeper to say who was driving.', tip: 'Answer within 28 days. Not answering is an offence with 6 points.' },
    { term: 'fixed penalty', slug: 'fixed-penalty', pattern: /fixed penalty/i, meaning: 'A set fine for a driving offence, often with penalty points on your licence.' },
    { term: 'speed awareness course', slug: 'speed-awareness-course', pattern: /speed awareness/i, meaning: 'A short course you can sometimes take instead of getting penalty points for minor speeding.' },
    { term: 'V5C', slug: 'v5c', pattern: /\bV5C\b|logbook/i, meaning: 'The vehicle logbook. It shows who the registered keeper of a vehicle is.' },
    { term: 'SORN', slug: 'sorn', pattern: /\bSORN\b/, meaning: 'Statutory Off Road Notification. Tells the DVLA your vehicle is off the road, so you don’t need to tax it.' },
    { term: 'TV Licence', slug: 'tv-licence', pattern: /TV licen[cs]e/i, meaning: 'A yearly licence you need to watch or record live TV on any channel, or to use BBC iPlayer.' },
    { term: 'eVisa', slug: 'evisa', pattern: /\beVisa\b/i, meaning: 'Your digital proof of immigration status, in your UKVI account. It replaced most physical cards (BRPs).' },
    { term: 'administrative review', slug: 'administrative-review', pattern: /administrative review/i, meaning: 'Asking the Home Office to check a refusal for mistakes. Often allowed only within 14 days.' },
    { term: 'notice seeking possession', slug: 'notice-seeking-possession', pattern: /notice seeking possession|section (?:21|8)\b/i, meaning: 'A notice from your landlord that they want you to leave and may go to court.', tip: 'It doesn’t make you leave by itself. Get advice from Shelter or Citizens Advice — the notice may not be valid.' },
    { term: 'deposit protection', slug: 'deposit-protection', pattern: /deposit protection|deposit scheme/i, meaning: 'In England and Wales, landlords must put your deposit in a government-approved scheme and give you the details.' },
    { term: 'Direct Debit', slug: 'direct-debit', pattern: /direct debit/i, meaning: 'Permission for a company to take payments from your bank account. Protected by the Direct Debit Guarantee.' },
    { term: 'ombudsman', slug: 'ombudsman', pattern: /ombudsman/i, meaning: 'A free, independent service that looks at complaints you couldn’t solve with the company or office.' },
  ],
  replies: {
    you: { name: '[Your full name]', street: '[Your address]', city: '[Town and postcode]', place: '[Town]' },
    closing: ['Yours faithfully,', '', '', '[Signature]', '[Your full name]'],
    letterOf: (date) => (date ? `dated ${date}` : 'dated [DD/MM/YYYY]'),
    objection: {
      subject: (term, of) => `Re: ${capitalize(term)} — your letter ${of}`,
      body: (term, of) => [
        `I do not agree with your decision in your letter ${of}. Please accept this letter as my ${term}.`,
        '',
        'Reason: [Explain in a few sentences why you disagree. Attach copies of any proof.]',
        '',
        'Please look at my case again and confirm in writing that you have received this letter.',
      ],
    },
    instalments: {
      subject: 'Re: Request for a payment arrangement',
      body: (of, amount) => [
        `Your letter ${of} asks me to pay ${amount ?? '[amount]'}.`,
        'I am not able to pay the full amount at once.',
        '',
        'I would like to pay in monthly instalments of [amount], starting on [date]. [I have attached a summary of my income and outgoings.]',
        '',
        'Please let me know if you agree, and put any further action on hold while you consider this.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'mandatory-reconsideration',
      title: 'Ask for a mandatory reconsideration',
      advice: 'Use this if you disagree with a benefit decision. Send it within one month of the date on the decision letter — you can also ask by phone or in your Universal Credit journal. You must do this before you can appeal to a tribunal.',
      english: 'I disagree with your decision and ask for a mandatory reconsideration. Reason: [your reason]. I attach evidence. Please confirm that you received this request.',
      subject: 'Re: Request for mandatory reconsideration',
      body: (result) => [
        `I am writing about your decision ${letterOf(result)}.`,
        '',
        'I disagree with this decision and I am asking for a mandatory reconsideration.',
        '',
        'Reason: [Explain which parts of the decision are wrong and why. For example: the points for daily living don’t match my needs, because …]',
        '',
        '[I have attached new evidence, for example letters from my doctor.]',
        '',
        'Please send me a copy of the evidence you used to make the decision, and confirm that you have received this request.',
      ],
      when: (result) => result.kind?.id === 'benefit-decision' || (['overpayment', 'refusal'].includes(result.kind?.id) && (result.sender?.id === 'dwp' || /universal credit|\bDWP\b|\bPIP\b/i.test(result.text ?? ''))),
      replaces: 'objection',
    },
    {
      id: 'pcn-challenge',
      title: 'Challenge a Penalty Charge Notice',
      advice: 'Use this if you think the PCN is wrong, for example the signs were unclear or you had a valid permit. Send it within the discount period (usually 14 days) — the council often keeps the discount open while it looks at it. Many councils also accept challenges online.',
      english: 'I challenge this Penalty Charge Notice. Reason: [your reason]. I attach proof. Please cancel the PCN, or keep the discount open while you consider this.',
      subject: 'Re: Challenge to Penalty Charge Notice',
      body: (result) => [
        `I am challenging the Penalty Charge Notice ${letterOf(result)}.`,
        '',
        'Reason: [Explain why the PCN should be cancelled, for example: the parking signs were missing or unclear / I had a valid permit or ticket / I was loading or unloading.]',
        '',
        '[I have attached photos and other proof.]',
        '',
        'Please cancel the PCN. If you do not agree, please keep the discounted amount open while you consider my challenge.',
      ],
      when: (result) => result.kind?.id === 'pcn',
      replaces: 'objection',
    },
    {
      id: 'dispute-debt',
      title: 'Dispute the debt and ask for proof',
      advice: 'Use this if you don’t recognise the debt or the amount looks wrong. Send it within the time in the letter (for a letter of claim, 30 days) and keep a copy. Ask them to put collection on hold while they reply.',
      english: 'I dispute this debt. Please send me proof: a copy of the agreement, a statement showing how the amount was worked out, and proof that you have the right to collect it. Please put collection on hold until then.',
      subject: 'Re: Disputed debt — request for information',
      body: (result) => [
        `I have received your letter ${letterOf(result)} about a debt of ${amountOf(result)}.`,
        '',
        'I dispute this debt. Please send me:',
        '- a copy of the signed agreement,',
        '- a statement of account showing how you worked out the amount,',
        '- proof that you have the right to collect this debt (for example a notice of assignment).',
        '',
        'Please put this account on hold until you have sent this information.',
        '',
        'This letter is not an admission that I owe this debt.',
      ],
      when: (result) => result.sender?.id === 'debt-collector' || result.kind?.id === 'letter-of-claim',
      replaces: 'objection',
    },
  ],
  samples: [
    {
      id: 'hmrc',
      title: 'HMRC',
      subtitle: 'Tax to pay (Simple Assessment)',
      build(today) {
        const letter = addDays(today, -3);
        const [year, month] = today.split('-').map(Number);
        const end = month >= 4 ? year : year - 1;
        const january = `${end + 1}-01-31`;
        const threeMonths = addMonths(letter, 3);
        const due = threeMonths > january ? threeMonths : january;
        return `HM Revenue and Customs
BX9 1AS

Date: ${longDate(letter)}
Our reference: 1234567890
National Insurance number: QQ 12 34 56 C

Mr Sam Example
12 Example Road
Leeds
LS1 4AB

Simple Assessment for the tax year ${end - 1} to ${end}

Dear Mr Example

We have worked out that you have not paid enough Income Tax for the tax year 6 April ${end - 1} to 5 April ${end}. This is because your pension income was taxed using the wrong tax code.

Tax you owe: £1,234.56
Pay by: ${longDate(due)}

How to pay
You can pay online at www.gov.uk/simple-assessment. You can also pay by bank transfer:
Account name: HMRC Example Account
Sort code: 12-34-56
Account number: 12345678
Payment reference: 1234567890K

If you disagree with this calculation, contact us within 60 days of the date of this letter. Tell us which figures you think are wrong and why.

If you cannot pay the full amount by ${longDate(due)}, you may be able to set up a Time to Pay arrangement. If you do not pay on time, we will charge interest and you may have to pay a penalty.

Yours sincerely

HM Revenue and Customs`;
      },
    },
    {
      id: 'jobcentre',
      title: 'Jobcentre',
      subtitle: 'Universal Credit appointment',
      build(today) {
        const letter = addDays(today, -2);
        const appointment = nextWorkday(addDays(today, 8));
        return `Department for Work and Pensions
Jobcentre Plus
3 Example Street
Manchester
M1 2AB

Date: ${longDate(letter)}
National Insurance number: QQ 98 76 54 A

Ms Alex Example
Flat 4, 27 Sample Lane
Manchester
M14 5CD

Universal Credit: you must attend an appointment

Dear Ms Example

You must attend an appointment with your work coach at Manchester Jobcentre, 3 Example Street, on ${dayDate(appointment)} at 9:30am.

Please bring:
- this letter
- photo ID, for example your passport or driving licence
- proof of your address

We will talk about your claim and the work-related things you need to do.

If you cannot attend, tell us before the appointment through your Universal Credit journal or by calling 0800 000 0000. If you do not attend and do not have a good reason, your Universal Credit payment could be reduced. This is called a sanction.

Yours sincerely

Work Coach Team
Manchester Jobcentre`;
      },
    },
  ],
};
