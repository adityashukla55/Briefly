import { addDays, formatLocalDate, fromIso } from '../dates.js';

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

function irishDate(iso) {
  return formatLocalDate(iso, '/', 'dmy');
}

function letterOf(result) {
  return result.letterDate ? `dated ${irishDate(result.letterDate)}` : 'dated [DD/MM/YYYY]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: money.currency ?? 'EUR' }).format(money.amount) : '[amount]';
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default {
  id: 'ie',
  slug: 'ireland',
  name: 'Ireland',
  adjective: 'Irish',
  flag: '🇮🇪',
  language: 'en',
  locale: 'en-IE',
  currency: 'EUR',
  decimal: '.',
  thousands: ',',
  dateSeparator: '/',
  dateOrder: 'dmy',
  ibanLength: 22,
  intro: 'In Ireland, many deadlines are short — for example 21 days to appeal a social welfare decision, or 28 days to pay a fixed charge notice. Many offices also send letters to your online account (MyWelfare, myAccount or MyGovID), so check them often.',
  signals: [
    /\bIreland\b|(?<![A-Za-zÀ-ɏ])Éire\b/i,
    /\.ie\b/i,
    /\bIE\d{2}\s?[A-Z]{4}/,
    /\bPPS ?N(?:o|umber)?\b|Personal Public Service/i,
    /\bRevenue Commissioners\b|\bROS\b|\bmyAccount\b/i,
    /Department of Social Protection|\bDSP\b|\bMyWelfare\b|\bIntreo\b/i,
    /An Garda Síochána|\bGarda(?:í)?(?![A-Za-zÀ-ɏ])/i,
    /\bEircode\b|\b[AC-FHKNPRTV-Y]\d{2}\s?[AC-FHKNPRTV-Y0-9]{4}\b/,
    /\b(?:Dublin|Cork|Galway|Limerick|Waterford|Kilkenny|Wexford|Sligo|Kerry|Mayo|Donegal|Meath|Kildare|Wicklow|Louth|Tipperary|Clare|Westmeath|Laois|Offaly|Cavan|Monaghan|Roscommon|Longford|Leitrim|Carlow)\b/,
    /Local Property Tax|\bLPT\b/,
    /Citizens Information|\bMABS\b/i,
    /Uisce Éireann|Irish Water|\bESB\b|Bord Gáis|Electric Ireland/i,
  ],
  deliveryDays: 2,
  deliveryNote: 'In Ireland, many deadlines count from the date printed on the letter. When a deadline counts from when you received it, Briefly adds about 2 days for post — check the envelope or postmark if you are close to the deadline.',
  objectionAdvice: 'Use this if you think the decision is wrong. Check the letter first: many Irish offices want their own appeal form or an online request (for example MyWelfare or myAccount). Send it before the deadline and keep a copy and proof of posting.',
  objectionDefault: 'appeal',
  deadlineWords: ['by', 'within', 'no later than'],
  objection: [
    { word: 'review', pattern: /\breview\b/i },
    { word: 'appeal', pattern: /\bappeal/i },
    { word: 'dispute', pattern: /\bdispute/i },
    { word: 'objection', pattern: /\bobject(?:ion)?\b/i },
  ],
  help: {
    debt: 'MABS, the free Money Advice and Budgeting Service',
    tenant: 'Threshold (free housing advice) or Citizens Information',
    instalments: 'payment arrangement',
    general: 'Citizens Information (free and independent), or FLAC for free legal advice',
  },
  senders: [
    {
      id: 'revenue',
      slug: 'revenue',
      name: 'Tax office',
      local: 'Revenue (Revenue Commissioners)',
      about: 'The Irish tax office. It handles income tax, USC, PRSI, Local Property Tax (LPT) and tax refunds.',
      patterns: [/\bRevenue Commissioners\b/i, /\bRevenue\b/, /\bmyAccount\b/i, /\bROS\b/, /Local Property Tax|\bLPT\b/, /Statement of Liability|balancing statement/i, /\bUSC\b|Universal Social Charge/i, /Form 11\b|Form 12\b/i, /tax credit certificate/i],
      letters: ['Statement of Liability — your tax for the year: a refund or an underpayment', 'Notice of assessment — tax you owe after a tax return', 'Local Property Tax letter — what you owe for your home and how to pay', 'Tax credit certificate — your tax credits and rate band for your employer'],
      tips: ['Revenue never asks for payment by text or by gift cards. Check letters in your myAccount on revenue.ie.', 'If you can’t pay at once, ask for a phased payment arrangement.'],
    },
    {
      id: 'dsp',
      slug: 'department-of-social-protection',
      name: 'Social welfare office',
      local: 'Department of Social Protection (Intreo)',
      about: 'Pays social welfare, for example Jobseeker’s Allowance, Child Benefit, pensions and illness benefit. Intreo is its local office.',
      patterns: [/Department of Social Protection|\bDSP\b/i, /\bIntreo\b/i, /\bMyWelfare\b/i, /Jobseeker[’']?s (?:Allowance|Benefit)/i, /Child Benefit/i, /Social Welfare Appeals Office/i, /deciding officer/i, /\bPRSI\b/, /\bcase officer\b/i],
      letters: ['Decision letter — your claim was approved, refused or changed', 'Meeting letter — you must attend a meeting at your Intreo centre', 'Overpayment letter — they say you were paid too much', 'Review letter — they check if you still qualify'],
      tips: ['You can ask for a review of a decision, or appeal to the Social Welfare Appeals Office within 21 days of the decision.', 'Go to every meeting you are called to. Missing one without a good reason can reduce your payment.'],
    },
    {
      id: 'council',
      slug: 'local-council',
      name: 'Local council',
      local: 'County or City Council',
      about: 'Your local authority. It handles social housing, HAP, motor tax offices, parking and some local charges.',
      patterns: [/\b(?:County|City|City and County) Council\b/i, /local authority/i, /Housing Assistance Payment|\bHAP\b/, /housing (?:section|department|list)/i, /differential rent/i, /motor tax office/i, /commercial rates/i],
      letters: ['Housing letter — about your place on the housing list, HAP or rent', 'Rent arrears letter — your council rent is behind', 'Parking fine — for parking in a council area'],
      tips: ['Tell the council when your income or household changes — your rent or HAP depends on it.', 'If you fall behind with council rent, ask for a payment plan early.'],
    },
    {
      id: 'courts',
      slug: 'courts',
      name: 'Court',
      local: 'Courts Service (District / Circuit Court)',
      about: 'A court. Court papers are always important — never ignore them.',
      patterns: [/District Court/i, /Circuit Court/i, /High Court/i, /Courts Service/i, /civil (?:summons|bill)/i, /\bplaintiff\b/i, /\bdefendant\b/i, /\bsummons\b/i, /enter an appearance|appearance/i, /\bjudgment\b/i, /small claims/i],
      letters: ['Civil summons or civil bill — someone is suing you for money', 'Summons — you must come to court about an offence, for example a traffic fine', 'Judgment — the court’s decision that you must pay'],
      tips: ['Deadlines are short — often only 10 or 14 days to tell the court you will defend. Get advice straight away.', 'If you can’t afford a solicitor, ask the Legal Aid Board or FLAC.'],
    },
    {
      id: 'sheriff',
      slug: 'sheriff',
      name: 'Sheriff',
      local: 'Sheriff / Revenue Sheriff',
      about: 'Collects debts after a court judgment or for Revenue. Fees are added to the debt.',
      patterns: [/\bsheriff\b/i, /county registrar/i, /execution order/i, /certificate of enforcement/i, /Revenue Sheriff/i, /seize (?:goods|property)/i],
      letters: ['Notice from the sheriff — pay now, or goods can be seized', 'Certificate of enforcement — Revenue sent your tax debt to a sheriff or solicitor'],
      tips: ['Contact them today and offer a payment plan. Fees grow quickly.', 'Get free help from MABS before you agree to anything you can’t afford.'],
    },
    {
      id: 'debt-collector',
      slug: 'debt-collector',
      name: 'Debt collector',
      local: 'Debt collection agency',
      about: 'A company that collects debts for others, or that bought an old loan or bill. Check that the debt is yours and the amount is right.',
      patterns: [/debt collect/i, /collection agency/i, /debt recovery/i, /credit servic(?:er|ing)/i, /original creditor/i, /\bcreditor\b/i, /letter before action/i, /transferred to us/i],
      letters: ['Notice that your loan or debt was sold — a new company now collects it', 'Demand for payment — pay or agree a plan', 'Letter before action — they plan to go to court'],
      tips: ['Ask for proof if you don’t recognise the debt: the agreement and a statement of the account.', 'Most debts can’t be taken to court after 6 years without payment or written acknowledgement. Get advice before paying an old debt.'],
    },
    {
      id: 'garda',
      slug: 'garda',
      name: 'Police',
      local: 'An Garda Síochána',
      about: 'The Irish police. It sends fixed charge notices for speeding and other road offences, and other police letters.',
      patterns: [/An Garda Síochána/i, /\bGarda(?:í)?(?![A-Za-zÀ-ɏ])/i, /Fixed Charge (?:Notice|Processing Office)/i, /\bFCPO\b/, /penalty points/i, /\bGoSafe\b/i, /speed camera/i, /road traffic/i],
      letters: ['Fixed charge notice — pay the fine within 28 days, or 50% more in the next 28 days', 'Request to name the driver — say who was driving', 'Court summons — the fine wasn’t paid in time'],
      tips: ['If you weren’t driving, give the driver’s details as the notice explains, within the time given.', 'Pay only through the official website or address on the notice. Texts asking for fines are often scams.'],
    },
    {
      id: 'motor',
      slug: 'motor-tax-and-licences',
      name: 'Motor tax and driving licences',
      local: 'Motor Tax / NDLS',
      about: 'Motor tax is paid online or at your council’s motor tax office. Driving licences are issued by the NDLS.',
      patterns: [/motor tax/i, /\bNDLS\b|National Driver Licence Service/i, /driving licen[cs]e/i, /\bNCT\b/, /vehicle registration/i, /learner permit/i],
      letters: ['Motor tax reminder — your tax runs out soon', 'Driving licence renewal reminder', 'NCT reminder — your car test is due'],
      tips: ['Use only motortax.ie and ndls.ie. Other websites may charge extra.'],
    },
    {
      id: 'tv-licence',
      slug: 'tv-licence',
      name: 'TV licence office',
      local: 'TV Licence (An Post)',
      about: 'An Post collects the TV licence fee. You need one if you have a TV set at home.',
      patterns: [/TV Licen[cs]e/i, /An Post/i, /licen[cs]e fee/i, /television set/i],
      letters: ['Renewal reminder — your licence runs out soon', 'Letter to an unlicensed address — they think you need a licence'],
      tips: ['If you don’t have a TV set, tell An Post so the letters stop.', 'Some people on social welfare get a free TV licence through the Household Benefits Package.'],
    },
    {
      id: 'immigration',
      slug: 'immigration-service',
      name: 'Immigration office',
      local: 'Immigration Service Delivery (Department of Justice)',
      about: 'Decides on visas and permission to stay, and issues the Irish Residence Permit (IRP).',
      patterns: [/Immigration Service Delivery|\bISD\b/, /Department of Justice/i, /Irish Residence Permit|\bIRP\b/, /permission to remain|stamp \d/i, /immigration (?:permission|registration)/i, /deportation|section 3 notice/i, /Burgh Quay/i],
      letters: ['Decision letter — your permission to stay was granted or refused', 'Registration or renewal letter — about your IRP card', 'Request for documents — they need more papers'],
      tips: ['Renew your permission before it ends — you can usually do it online.', 'If you get a refusal or a deportation-related letter, contact a solicitor or a free legal service right away.'],
    },
    {
      id: 'energy',
      slug: 'energy-supplier',
      name: 'Energy supplier',
      local: 'Electricity or gas supplier',
      about: 'The company that sells you electricity or gas, for example Electric Ireland, Bord Gáis Energy or SSE Airtricity.',
      patterns: [/Electric Ireland|Bord Gáis|SSE Airtricity|Energia|Flogas|Pinergy/i, /\bESB\b/, /\bMPRN\b|\bGPRN\b/, /\bkWh\b/i, /meter reading/i, /\bCRU\b/, /disconnection/i, /pay as you go meter/i],
      letters: ['Bill — what you used and when to pay', 'Arrears or disconnection warning — unpaid bills', 'Price change letter — your tariff changes'],
      tips: ['If you can’t pay, call them and ask for a payment plan. Suppliers must offer one before disconnecting.', 'If a complaint isn’t solved, you can go to the CRU for free.'],
    },
    {
      id: 'water',
      slug: 'uisce-eireann',
      name: 'Water company',
      local: 'Uisce Éireann (Irish Water)',
      about: 'The national water company. Most homes don’t pay for water, but there can be letters about excess use, leaks or works.',
      patterns: [/Uisce Éireann/i, /Irish Water/i, /excess (?:water )?use/i, /water (?:supply|meter|charges)/i],
      letters: ['Excess use letter — your home used more water than the free allowance', 'Leak letter — a leak may be wasting water on your side', 'Works notice — planned work on the water supply'],
      tips: ['If they say you may have a leak, check and fix it — you can often avoid charges.'],
    },
    {
      id: 'landlord',
      slug: 'landlord',
      name: 'Landlord',
      local: 'Landlord / letting agent',
      about: 'The owner of your home, or the agency that manages it. Most tenancies must be registered with the RTB.',
      patterns: [/\blandlord\b/i, /letting agen(?:t|cy)/i, /\btenan(?:t|cy)\b/i, /Residential Tenancies Board|\bRTB\b/, /notice of termination/i, /rent review/i, /rent arrears/i, /\bdeposit\b/i],
      letters: ['Notice of termination — your landlord wants to end the tenancy', 'Rent review — your rent will change', 'Rent arrears warning — you are behind with rent'],
      tips: ['A notice of termination must follow strict rules (in writing, signed, with the right notice period). Many are not valid — check with Threshold.', 'Disagreements can go to the RTB. Its dispute service is low-cost.'],
    },
    {
      id: 'hse',
      slug: 'hse',
      name: 'Health service',
      local: 'HSE',
      about: 'The Health Service Executive. It runs public hospitals and health services, and medical cards.',
      patterns: [/\bHSE\b/, /Health Service Executive/i, /medical card/i, /GP visit card/i, /\bhospital\b/i, /outpatient/i, /Primary Care Reimbursement|\bPCRS\b/i],
      letters: ['Appointment letter — date, time and place of a hospital appointment', 'Medical card letter — your card was approved, refused or is up for review', 'Hospital charges — a bill for a stay in a public hospital'],
      tips: ['If you can’t go to an appointment, tell the hospital as soon as possible.', 'Answer medical card review letters on time, or your card can be cancelled.'],
    },
  ],
  kinds: [
    {
      id: 'enforcement', type: 'enforcement', local: 'Enforcement notice (sheriff)', name: 'Enforcement notice', about: 'A sheriff or solicitor will collect the debt. Fees are added, and goods can be seized.', urgency: 'high', objection: false, patterns: [/\bsheriff\b/i, /execution order/i, /certificate of enforcement/i, /enforcement (?:action|proceedings)/i, /attachment of earnings/i],
      steps: ['Contact them today and offer a payment plan you can really afford. Ask MABS for free help.'],
    },
    {
      id: 'court-claim', type: 'court-order', local: 'Civil summons / civil bill', name: 'Court case against you', about: 'Someone is suing you. You must tell the court you will defend it, usually within a short time, or they can get judgment without a hearing.', urgency: 'high', objection: false, extendable: false, patterns: [/civil (?:summons|bill)/i, /enter an appearance/i, /notice of intention to defend/i, /\bplaintiff\b/i, /judgment in default/i],
      steps: ['Act now — often you have only 10 or 14 days to enter an appearance or say you will defend. If you do nothing, judgment can be given against you.', 'Get free advice from FLAC, the Legal Aid Board or Citizens Information.'],
    },
    {
      id: 'reminder', type: 'reminder', local: 'Reminder / final demand', name: 'Payment reminder', about: 'A payment is late. If you don’t pay, the next step is often court or a debt collector.', urgency: 'high', patterns: [/\breminder\b/i, /final (?:notice|demand|reminder)/i, /\boverdue\b/i, /\barrears\b/i, /outstanding (?:balance|amount)/i, /not (?:yet )?(?:been )?paid/i],
    },
    {
      id: 'overpayment', type: 'repayment', local: 'Overpayment letter', name: 'Request to pay money back', about: 'They say they paid you too much social welfare or another payment, and want the money back.', urgency: 'high', patterns: [/\boverpa(?:id|yment)\b/i, /recover(?:y of)? (?:the )?overpayment/i, /pay (?:this|it|the money) back/i, /deductions? from your (?:weekly )?payment/i],
      steps: ['If you think it’s wrong, ask for a review or appeal within 21 days.', 'If repayments are too high for you, ask them to lower the weekly or monthly amount.'],
    },
    {
      id: 'fixed-charge', type: 'fine', local: 'Fixed charge notice', name: 'Road traffic fine', about: 'A fine for speeding or another road offence, often with penalty points. Pay within 28 days, or 50% more in the next 28 days. If you don’t pay, you get a court summons.', urgency: 'high', objection: false, extendable: false, instalments: false, patterns: [/fixed charge notice/i, /fixed charge/i, /penalty points/i, /\bFCPO\b/, /speeding offence|exceeding the speed limit/i],
      steps: ['If you weren’t driving, give the driver’s details as the notice explains instead of paying.', 'If you don’t pay in time, you get a court summons, and the fine and points can be higher.'],
    },
    {
      id: 'parking', type: 'fine', local: 'Parking fine', name: 'Parking fine', about: 'A fine for parking. Council fines usually go up if you pay late; private car park charges are bills under a contract.', urgency: 'medium', patterns: [/parking (?:fine|charge|notice|ticket)/i, /\bclamp/i, /parking enforcement/i, /car park/i],
      steps: ['If you think it’s unfair, appeal to the issuer by the date in the letter. Keep your ticket, receipts and photos.'],
    },
    {
      id: 'tax-bill', type: 'tax-assessment', local: 'Statement of Liability / Notice of assessment', name: 'Tax bill or tax result', about: 'Revenue worked out your tax for a year. It shows a refund, or tax you still owe.', urgency: 'medium', patterns: [/statement of liability/i, /notice of (?:amended )?assessment/i, /balancing statement/i, /underpayment/i, /overpayment of tax/i, /tax (?:year|period) \d{4}/i, /Local Property Tax|\bLPT\b/],
      steps: ['Check the figures in myAccount. If something is wrong, contact Revenue or appeal to the Tax Appeals Commission within the time in the letter — usually 30 days.', 'If you owe tax and can’t pay it all, ask Revenue for a phased payment arrangement.'],
    },
    {
      id: 'welfare-decision', type: 'decision', local: 'Social welfare decision', name: 'Social welfare decision', about: 'A decision on your social welfare claim — for example the amount, a change, or that it stops.', urgency: 'medium', patterns: [/deciding officer/i, /we have decided|decision (?:letter|on your claim)/i, /your (?:claim|payment) (?:has been|was) (?:awarded|reduced|stopped|suspended)/i, /Social Welfare Appeals Office/i, /penalty rate/i],
      steps: ['If you disagree, ask for a review or appeal to the Social Welfare Appeals Office within 21 days of the decision. You can appeal online, by post or by email.'],
    },
    {
      id: 'refusal', type: 'rejection', local: 'Refusal letter', name: 'Refusal', about: 'Your application was refused. The letter says if you can ask for a review or appeal, and by when.', urgency: 'medium', patterns: [/\brefus(?:al|ed)\b/i, /has been (?:refused|rejected|disallowed)/i, /not (?:been )?approved/i, /does not qualify|you do not satisfy/i],
      steps: ['Look for the part about your right to a review or appeal. For social welfare it is usually 21 days.'],
    },
    { id: 'approval', type: 'approval', local: 'Approval letter', name: 'Approval', about: 'Your application was approved. Check that names, dates and amounts are right.', urgency: 'low', patterns: [/has been (?:approved|granted|awarded)/i, /we are pleased to (?:tell|inform) you/i, /\bawarded\b/i] },
    {
      id: 'meeting', type: 'appointment', local: 'Meeting / appointment letter', name: 'Appointment', about: 'You must come to a meeting or appointment, for example at Intreo, a hospital or an immigration office. Missing it can reduce your payment or delay your case.', urgency: 'medium', patterns: [/\bappointment\b/i, /you (?:must|are required to) attend/i, /please attend/i, /\bmeeting\b/i, /\binterview\b/i],
      steps: ['For Intreo meetings: if you can’t go, tell your case officer before the meeting and give the reason. Missing it without a good reason can lead to a reduced payment.'],
    },
    {
      id: 'documents', type: 'documents', local: 'Request for information', name: 'Request for documents', about: 'They need papers or information before they can decide, or to keep paying you.', urgency: 'medium', patterns: [/please (?:send|provide|return) (?:us )?(?:the following|copies)/i, /we need (?:more )?information/i, /request for (?:information|documents)/i, /review form/i] },
    {
      id: 'termination', type: 'termination', local: 'Notice of termination', name: 'Notice to end the tenancy', about: 'Your landlord wants to end the tenancy. The notice must follow strict rules — many are not valid.', urgency: 'high', objection: false, patterns: [/notice of termination/i, /terminat(?:e|ion of) (?:your |the )?tenancy/i, /vacate the (?:property|dwelling)/i, /\bevict/i],
      steps: ['Don’t move out because of the notice alone. Check it with Threshold or Citizens Information — the notice may not be valid, and you can refer a dispute to the RTB.'],
    },
    {
      id: 'utility-bill', type: 'utility-bill', local: 'Energy bill', name: 'Energy bill', about: 'A bill for electricity or gas. It shows what you used and when to pay.', urgency: 'medium', patterns: [/\bkWh\b/i, /\bMPRN\b|\bGPRN\b/, /meter reading/i, /standing charge/i, /unit rate/i],
      steps: ['Check that the meter readings are right. If the bill is estimated, send a real reading.'],
    },
    { id: 'bill', type: 'bill', local: 'Bill / statement', name: 'Bill', about: 'A bill or account statement. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bbill\b/i, /\bstatement\b/i, /\binvoice\b/i, /amount due/i, /\bdue date\b/i] },
  ],
  references: [
    { name: 'Reference number', local: 'Our reference', pattern: /(?:\bour ref(?:erence)?(?: number)?|\breference (?:number|no\.?)|\bcase (?:number|no\.?))/gi },
    { name: 'Court record number', local: 'Record number', pattern: /(?:\brecord (?:number|no\.?)|\bcourt (?:number|no\.?))/gi },
    { name: 'Notice number', local: 'Notice number', pattern: /(?:\bnotice (?:number|no\.?)|\bfixed charge (?:notice )?(?:number|no\.?))/gi },
    { name: 'Property ID', local: 'Property ID', pattern: /\b(?:LPT )?property ID/gi },
    { name: 'Account number', local: 'Account number', pattern: /(?:\bcustomer (?:number|reference)|\baccount (?:number|reference|no\.?))/gi },
    { name: 'Meter number', local: 'MPRN', pattern: /\b(?:MPRN|GPRN)\b/gi },
    { name: 'Vehicle registration', local: 'Vehicle registration', pattern: /(?:\bvehicle registration(?: (?:mark|number))?|\bregistration (?:mark|number))/gi },
    { name: 'IRP number', local: 'IRP number', pattern: /(?:\bIRP (?:number|card number)|\bGNIB (?:number|no\.?))/gi },
    { name: 'PPS number', local: 'PPS number', personal: true, pattern: /(?:\bPPS ?N(?:o\.?|umber)?|\bPersonal Public Service Number)/gi },
    { name: 'Payment reference', local: 'Payment reference', payment: true, pattern: /\bpayment reference(?: number)?/gi },
  ],
  glossary: [
    { term: 'Revenue', slug: 'revenue', pattern: /\bRevenue Commissioners\b|\bRevenue\b/, meaning: 'The Irish tax office.' },
    { term: 'myAccount', slug: 'myaccount', pattern: /\bmyAccount\b/i, meaning: 'Your free online account with Revenue, where you see letters, tax credits and refunds.' },
    { term: 'ROS', slug: 'ros', pattern: /\bROS\b/, meaning: 'Revenue Online Service. Used by the self-employed and businesses to file tax returns.' },
    { term: 'PPS number', slug: 'pps-number', pattern: /\bPPS ?N(?:o|umber)?\b|Personal Public Service/i, meaning: 'Personal Public Service Number. Your personal number for tax, social welfare and public services.', tip: 'Give it only to employers, Revenue, social welfare and other public bodies.' },
    { term: 'Statement of Liability', slug: 'statement-of-liability', pattern: /statement of liability/i, meaning: 'A yearly summary from Revenue of your income and tax. It shows a refund or an underpayment.' },
    { term: 'underpayment', slug: 'underpayment', pattern: /\bunderpa(?:id|yment)/i, meaning: 'Tax you didn’t pay in full. Revenue often collects it by lowering your tax credits over a few years.' },
    { term: 'tax credits', slug: 'tax-credits', pattern: /tax credits?/i, meaning: 'Amounts that lower the tax you pay. Your employer uses them from your tax credit certificate.' },
    { term: 'USC', slug: 'usc', pattern: /\bUSC\b|Universal Social Charge/i, meaning: 'Universal Social Charge. A tax on income, on top of income tax.' },
    { term: 'PRSI', slug: 'prsi', pattern: /\bPRSI\b/, meaning: 'Pay Related Social Insurance. Contributions from your pay that give you the right to some social welfare payments and the State Pension.' },
    { term: 'Local Property Tax', slug: 'local-property-tax', pattern: /Local Property Tax|\bLPT\b/, meaning: 'A yearly tax on homes, paid to Revenue by the owner.' },
    { term: 'phased payment arrangement', slug: 'phased-payment-arrangement', pattern: /phased payment/i, meaning: 'A plan with Revenue to pay tax you owe in parts.' },
    { term: 'Tax Appeals Commission', slug: 'tax-appeals-commission', pattern: /Tax Appeals Commission/i, meaning: 'An independent body that hears appeals against Revenue decisions. You usually must appeal within 30 days.' },
    { term: 'Intreo', slug: 'intreo', pattern: /\bIntreo\b/i, meaning: 'The local office of the Department of Social Protection for jobseekers and social welfare.' },
    { term: 'MyWelfare', slug: 'mywelfare', pattern: /\bMyWelfare\b/i, meaning: 'The online service of the Department of Social Protection, where you can apply, see letters and appeal.' },
    { term: 'Jobseeker’s Allowance', slug: 'jobseekers-allowance', pattern: /Jobseeker[’']?s (?:Allowance|Benefit)/i, meaning: 'A weekly payment for people out of work. Jobseeker’s Benefit depends on your PRSI; Jobseeker’s Allowance depends on your means.' },
    { term: 'deciding officer', slug: 'deciding-officer', pattern: /deciding officer/i, meaning: 'The person in social welfare who made the decision on your claim.' },
    { term: 'Social Welfare Appeals Office', slug: 'social-welfare-appeals-office', pattern: /Social Welfare Appeals Office/i, meaning: 'An independent office that looks at appeals against social welfare decisions.', tip: 'Appeal within 21 days of the decision. You can send it online, by post or by email.' },
    { term: 'review', slug: 'review', pattern: /\breview\b/i, meaning: 'A new look at a decision, or a check that you still qualify for a payment.' },
    { term: 'overpayment', slug: 'overpayment', pattern: /\boverpa(?:id|yment)/i, meaning: 'Money paid to you by mistake that they want back.', tip: 'Check how they worked it out. If repayments are too high, ask them to lower the amount.' },
    { term: 'penalty rate', slug: 'penalty-rate', pattern: /penalty rate/i, meaning: 'A lower jobseeker’s payment, for example after missing a meeting without a good reason.' },
    { term: 'means test', slug: 'means-test', pattern: /means[- ]test/i, meaning: 'A check of your income and savings to see if you qualify for a payment.' },
    { term: 'Child Benefit', slug: 'child-benefit', pattern: /Child Benefit/i, meaning: 'A monthly payment for each child, paid to parents.' },
    { term: 'HAP', slug: 'hap', pattern: /\bHAP\b|Housing Assistance Payment/i, meaning: 'Housing Assistance Payment. The council pays most of your rent to the landlord; you pay a rent contribution to the council.' },
    { term: 'medical card', slug: 'medical-card', pattern: /medical card/i, meaning: 'A card from the HSE that gives free GP visits and many health services to people with low income.' },
    { term: 'civil bill', slug: 'civil-bill', pattern: /civil bill/i, meaning: 'Court papers that start a case in the Circuit Court.', tip: 'Act fast — you usually have only 10 days to enter an appearance.' },
    { term: 'civil summons', slug: 'civil-summons', pattern: /civil summons/i, meaning: 'Court papers that start a case in the District Court, for example for a debt.' },
    { term: 'appearance', slug: 'appearance', pattern: /enter an appearance|\bappearance\b/i, meaning: 'A form that tells the court you will defend the case.' },
    { term: 'judgment', slug: 'judgment', pattern: /\bjudg(?:e)?ment\b/i, meaning: 'The court’s decision. A judgment for a debt can go on the public Register of Judgments.' },
    { term: 'sheriff', slug: 'sheriff', pattern: /\bsheriff\b/i, meaning: 'An official who collects debts after a judgment, or for Revenue. Fees are added to the debt.' },
    { term: 'attachment of earnings', slug: 'attachment-of-earnings', pattern: /attachment of earnings/i, meaning: 'A court order that takes money for a debt or fine straight from your pay or social welfare.' },
    { term: 'statute-barred', slug: 'statute-barred', pattern: /statute[- ]barred|statute of limitations/i, meaning: 'A debt too old to take to court — usually 6 years after the last payment or written acknowledgement.' },
    { term: 'fixed charge notice', slug: 'fixed-charge-notice', pattern: /fixed charge notice/i, meaning: 'A fine for a road offence. Pay within 28 days, or 50% more within the next 28 days.', tip: 'If you don’t pay in time, you get a court summons.' },
    { term: 'penalty points', slug: 'penalty-points', pattern: /penalty points/i, meaning: 'Points on your driving licence for road offences. 12 points (7 for learners and new drivers) means you lose your licence for 6 months.' },
    { term: 'NCT', slug: 'nct', pattern: /\bNCT\b/, meaning: 'National Car Test. A regular safety test for cars older than 4 years.' },
    { term: 'motor tax', slug: 'motor-tax', pattern: /motor tax/i, meaning: 'Tax you must pay to use a car on public roads. Pay at motortax.ie.' },
    { term: 'TV licence', slug: 'tv-licence', pattern: /TV licen[cs]e/i, meaning: 'A yearly licence you need if you have a TV set at home. Paid to An Post.' },
    { term: 'IRP', slug: 'irp', pattern: /\bIRP\b|Irish Residence Permit/i, meaning: 'Irish Residence Permit. The card that shows you are registered and allowed to stay in Ireland.' },
    { term: 'RTB', slug: 'rtb', pattern: /\bRTB\b|Residential Tenancies Board/i, meaning: 'Residential Tenancies Board. It registers tenancies and settles disputes between tenants and landlords.' },
    { term: 'notice of termination', slug: 'notice-of-termination', pattern: /notice of termination/i, meaning: 'A written notice from your landlord or you to end a tenancy. It must follow strict rules.' },
    { term: 'rent review', slug: 'rent-review', pattern: /rent review/i, meaning: 'A change of your rent. In many areas, increases are limited by law.' },
    { term: 'MPRN', slug: 'mprn', pattern: /\bMPRN\b/, meaning: 'Meter Point Reference Number. The number of your electricity meter.' },
    { term: 'arrears', slug: 'arrears', pattern: /\barrears\b/i, meaning: 'Money you owe because regular payments were missed, for example rent.' },
    { term: 'MABS', slug: 'mabs', pattern: /\bMABS\b|Money Advice and Budgeting Service/i, meaning: 'Money Advice and Budgeting Service. Free, confidential help with debt and budgeting.' },
    { term: 'Citizens Information', slug: 'citizens-information', pattern: /Citizens Information/i, meaning: 'A free public service with information and advice on rights, social welfare, housing and more.' },
  ],
  replies: {
    you: { name: '[Your full name]', street: '[Your address]', city: '[Town and Eircode]', place: '[Town]' },
    closing: ['Yours faithfully,', '', '', '[Signature]', '[Your full name]'],
    letterOf: (date) => (date ? `dated ${date}` : 'dated [DD/MM/YYYY]'),
    objection: {
      subject: (term, of) => `Re: ${capitalize(term)} — your decision ${of}`,
      body: (term, of) => [
        `I do not agree with your decision ${of}. Please accept this letter as my ${term}.`,
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
        'I would like to pay in monthly instalments of [amount], starting on [date].',
        '',
        'Please let me know if you agree.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'welfare-appeal',
      title: 'Appeal a social welfare decision',
      advice: 'Use this if you disagree with a social welfare decision. Send it to the Social Welfare Appeals Office within 21 days of the decision, with a copy of the decision letter. You can also appeal online or by email.',
      english: 'I want to appeal the decision on my claim. Reason: [your reason]. I attach a copy of the decision and my evidence.',
      subject: 'Re: Appeal against a social welfare decision',
      body: (result) => [
        'To: Social Welfare Appeals Office',
        '',
        `I wish to appeal the decision ${letterOf(result)} on my claim for [name of the payment].`,
        '',
        'Reason: [Explain why the decision is wrong.]',
        '',
        '[I enclose a copy of the decision letter and my supporting documents.]',
        '',
        'Please confirm that you have received my appeal.',
      ],
      when: (result) => result.sender?.id === 'dsp' && ['welfare-decision', 'refusal', 'overpayment'].includes(result.kind?.id),
      replaces: 'objection',
    },
    {
      id: 'dispute-debt',
      title: 'Dispute the debt and ask for proof',
      advice: 'Use this if you don’t recognise the debt or the amount looks wrong. Send it by registered post and keep a copy.',
      english: 'I dispute this debt. Please send me a copy of the agreement and a statement of account, and stop collecting until then.',
      subject: 'Re: Disputed debt — request for information',
      body: (result) => [
        `I have received your letter ${letterOf(result)} about a debt of ${amountOf(result)}.`,
        '',
        'I dispute this debt. Please send me:',
        '- a copy of the signed agreement,',
        '- a statement of account showing how you worked out the amount,',
        '- proof that you have the right to collect this debt.',
        '',
        'Please put this account on hold until you have sent this information.',
        '',
        'This letter is not an admission that I owe this debt.',
      ],
      when: (result) => result.sender?.id === 'debt-collector',
      replaces: 'objection',
    },
  ],
  samples: [
    {
      id: 'revenue',
      title: 'Revenue',
      subtitle: 'Tax to pay and 30 days to appeal',
      build(today) {
        const letter = addDays(today, -3);
        const due = addDays(letter, 30);
        const year = Number(today.slice(0, 4)) - 1;
        return `Revenue
Office of the Revenue Commissioners
Dublin City
PO Box 1
Dublin 2

Date: ${longDate(letter)}
Our reference: 1234567T
PPS Number: 1234567T

Ms Niamh Example
12 Example Road
Galway
H91 X2Y3

Notice of Amended Assessment for the year ${year}

Dear Ms Example

We have reviewed your income tax return for ${year} and amended your assessment. Your tax is higher because some rental income was not included.

Amount due: €1,234.56
Pay by: ${longDate(due)}

You can pay online through myAccount or ROS, or by bank transfer:
IBAN: IE29 AIBK 9311 5212 3456 78
BIC: AIBKIE2D
Payment reference: 1234567T-${year}

If you do not agree with this assessment, you can appeal to the Tax Appeals Commission within 30 days of the date of this notice.

If you cannot pay the full amount, contact us about a phased payment arrangement.

Yours faithfully

Revenue Commissioners`;
      },
    },
    {
      id: 'intreo',
      title: 'Intreo',
      subtitle: 'Jobseeker meeting',
      build(today) {
        const letter = addDays(today, -2);
        const meeting = nextWorkday(addDays(today, 8));
        return `Department of Social Protection
Intreo Centre
Example Street
Cork
T12 AB34

Date: ${longDate(letter)}
PPS Number: 7654321W

Mr Tomás Example
Apartment 3, 5 Sample Quay
Cork
T23 CD56

Jobseeker’s Allowance: you must attend a meeting

Dear Mr Example

You must attend a meeting with your case officer at Cork Intreo Centre, Example Street, on ${dayDate(meeting)} at 9:30am.

Please bring:
- this letter
- photo ID, for example your passport or Public Services Card
- your CV

If you cannot attend, contact us before the meeting and tell us why. If you do not attend without a good reason, your Jobseeker’s Allowance may be paid at a lower rate.

Yours sincerely

Case Officer
Cork Intreo Centre`;
      },
    },
  ],
};
