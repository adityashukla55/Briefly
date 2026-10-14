import { addDays, formatLocalDate, fromIso } from '../dates.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

function isoDate(iso) {
  return formatLocalDate(iso, '-', 'ymd');
}

function writtenDate(iso, short = false) {
  const [year, month, day] = iso.split('-').map(Number);
  const name = MONTHS[month - 1];
  return `${short && name.length > 4 ? name.slice(0, 3) : name} ${day}, ${year}`;
}

function letterOf(result) {
  return result.letterDate ? `dated ${isoDate(result.letterDate)}` : 'dated [YYYY-MM-DD]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: money.currency ?? 'CAD' }).format(money.amount) : '[amount]';
}

export default {
  id: 'ca',
  slug: 'canada',
  name: 'Canada',
  adjective: 'Canadian',
  flag: '🇨🇦',
  language: 'en',
  currency: 'CAD',
  decimal: '.',
  thousands: ',',
  dateSeparator: '-',
  dateOrder: 'ymd',
  ibanLength: 0,
  intro: 'Official letters in Canada come from federal, provincial and city offices, and many now arrive online first — for example in your CRA My Account or your IRCC account. Briefly covers letters in English; letters in French, like most letters from Quebec, are not covered yet.',
  signals: [
    /\bCanada\b/,
    /canada revenue agency|agence du revenu du canada/i,
    /\bCRA\b/,
    /\bIRCC\b|immigration, refugees and citizenship canada/i,
    /service canada/i,
    /government of canada|gouvernement du canada/i,
    /\.gc\.ca\b|\bcanada\.ca\b/i,
    /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d\b/,
    /\b(?:ON|BC|AB|QC|MB|SK|NS|NB|NL|PE|YT|NT|NU)\s+[ABCEGHJ-NPRSTVXY]\d[A-Z]/,
    /\b(?:Ontario|British Columbia|Alberta|Quebec|Manitoba|Saskatchewan|Nova Scotia|New Brunswick|Newfoundland|Prince Edward Island|Yukon|Northwest Territories|Nunavut)\b/,
    /[Ss]ocial [Ii]nsurance [Nn]umber|\bSIN\b/,
    /\bUCI\b|unique client identifier/i,
    /\bCAD\b|\bC\$|\bCA\$/,
    /receiver general/i,
    /\bOHIP\b|\bICBC\b|serviceontario|\bWSIB\b|worksafebc|\bOSAP\b|\bNSLSC\b/i,
    /\b(?:cheque|centre|licence)s?\b/i,
  ],
  deadlineWords: ['deadline', 'pay by', 'due date', 'within', 'no later than'],
  deliveryDays: 0,
  deliveryNote: 'In Canada, many deadlines count from the date printed on the letter, not from the day it arrives — for example, the 90 days to object to a tax notice. Mail can take several days, so check the date on the letter and act early.',
  objectionAdvice: 'Use this if you think the decision is wrong. Send it before the deadline, and keep a copy and proof that you sent it. For a CRA tax notice, you can also object online in My Account (“Register my formal dispute”).',
  objection: [
    { word: 'notice of objection', pattern: /notice of objection|formal dispute/i },
    { word: 'request for reconsideration', pattern: /reconsideration/i },
    { word: 'appeal', pattern: /\bappeal/i },
    { word: 'objection', pattern: /\bobject(?:ion)?\b/i },
    { word: 'review', pattern: /request (?:a |an )?(?:screening )?review|request for (?:a )?review/i },
    { word: 'dispute', pattern: /\bdispute/i },
  ],
  help: {
    debt: 'a non-profit credit counselling agency, for example a member of Credit Counselling Canada',
    tenant: 'a community legal clinic or a tenant advice service in your province',
    instalments: 'a payment arrangement',
    general: 'a community legal clinic, a settlement agency for newcomers, or 211 (a free helpline that connects you to local services)',
  },
  senders: [
    {
      id: 'cra',
      slug: 'canada-revenue-agency',
      name: 'Federal tax office',
      local: 'Canada Revenue Agency (CRA)',
      about: 'Handles income tax and pays many benefits, like the Canada Child Benefit and the GST/HST credit. It also collects some government debts.',
      patterns: [/canada revenue agency/i, /agence du revenu du canada/i, /\bCRA\b/, /notice of (?:re)?assessment/i, /\bmy account\b/i, /income tax and benefit return/i, /canada child benefit/i, /\bCCB\b/, /GST\/HST credit/i, /receiver general/i, /tax centre/i, /canada\.ca\/(?:cra|taxes|my-cra)/i, /\breassess/i],
      letters: ['Notice of assessment — the result of your tax return: what you owe or get back', 'Notice of reassessment — they changed your return, for example after a review', 'Review letter — they want receipts or documents to check something you claimed', 'Statement of account or legal warning — you still owe money'],
      tips: ['Scammers often pretend to be the CRA. The real CRA never asks for gift cards, prepaid cards or crypto, and never threatens arrest. If you’re unsure, check My Account or call the number on canada.ca.', 'File a tax return every year, even with no income. Many benefits, like the CCB and the GST/HST credit, depend on it.'],
    },
    {
      id: 'ircc',
      slug: 'ircc',
      name: 'Immigration office',
      local: 'Immigration, Refugees and Citizenship Canada (IRCC)',
      about: 'Decides on visas, work and study permits, permanent residence and citizenship.',
      patterns: [/immigration, refugees and citizenship canada/i, /immigration, réfugiés et citoyenneté canada/i, /\bIRCC\b/, /citizenship and immigration canada/i, /\bUCI\b/, /unique client identifier/i, /biometric/i, /procedural fairness/i, /permanent residen/i, /work permit/i, /study permit/i, /temporary resident visa|visitor visa/i, /\bCOPR\b/, /\bcitizenship\b/i, /\bPR card\b/i],
      letters: ['Acknowledgment of receipt (AOR) — they got your application and started to process it', 'Biometric instruction letter (BIL) — give your fingerprints and photo, usually within 30 days', 'Request for documents or procedural fairness letter — they need more from you before they decide', 'Passport request, approval or refusal — the last steps and their decision'],
      tips: ['Check your IRCC online account often. Many letters arrive there, not by post, and deadlines often count from the date of the letter.', 'Apply to extend your permit before it expires. If you do, you can usually stay under the same conditions while you wait (maintained status).'],
    },
    {
      id: 'service-canada',
      slug: 'service-canada',
      name: 'Federal benefits office',
      local: 'Service Canada',
      about: 'Handles Employment Insurance (EI), the Canada Pension Plan (CPP), Old Age Security (OAS) and Social Insurance Numbers (SIN).',
      patterns: [/service canada/i, /employment and social development canada/i, /\bESDC\b/, /employment insurance/i, /\bEI\b/, /canada pension plan/i, /\bCPP\b/, /old age security/i, /\bOAS\b/, /guaranteed income supplement/i, /record of employment/i, /my service canada account/i, /\bMSCA\b/, /canada employment insurance commission/i],
      letters: ['EI decision — whether you get Employment Insurance, and how much', 'Notice of debt — you got too much EI or pension and must pay it back', 'Request for information — they need answers or papers before they decide', 'CPP or OAS letter — your pension, or a decision on your application'],
      tips: ['If you disagree with an EI, CPP or OAS decision, ask for a reconsideration first. For EI you usually have 30 days; for CPP and OAS usually 90 days.', 'Open a My Service Canada Account to see your EI, CPP and OAS letters online.'],
    },
    {
      id: 'health-insurance',
      slug: 'provincial-health-insurance',
      name: 'Provincial health insurance',
      local: 'Provincial health plan (OHIP, MSP, AHCIP …)',
      about: 'Your province’s public health insurance. It pays for doctor and hospital care that you need.',
      patterns: [/\bOHIP\b/, /ontario health insurance/i, /medical services plan/i, /\bMSP\b/, /\bAHCIP\b/, /alberta health care insurance/i, /health care insurance plan/i, /health card/i, /BC services card/i, /ministry of health/i, /manitoba health/i, /saskatchewan health/i],
      letters: ['Health card renewal — your card ends soon', 'Eligibility letter — they need proof that you live in the province or have a valid status', 'Coverage letter — when your cover starts or ends'],
      tips: ['Your health card may end when your work or study permit ends. Renew it as soon as you get a new permit.', 'Some provinces have a waiting period for new residents. Get private health insurance until your cover starts.'],
    },
    {
      id: 'provincial-finance',
      slug: 'provincial-finance',
      name: 'Provincial finance office',
      local: 'Ministry of Finance / Revenue (your province)',
      about: 'Handles some provincial taxes and collects money owed to the province.',
      patterns: [/ministry of finance/i, /revenue services of british columbia/i, /tax and revenue administration/i, /provincial (?:tax|revenue)/i, /land transfer tax/i, /\bPST\b/, /employer health tax/i],
      letters: ['Notice of assessment — a decision on a provincial tax, for example land transfer tax or sales tax (PST)', 'Statement of account — money you owe the province', 'Collection letter — an old debt the province wants paid'],
      tips: ['Outside Quebec, your provincial income tax is handled by the CRA with your federal return. Letters from the province itself are usually about other taxes or debts.'],
    },
    {
      id: 'licensing',
      slug: 'driver-vehicle-licensing',
      name: 'Driver and vehicle licensing',
      local: 'ServiceOntario / ICBC / registry office',
      about: 'Issues driver’s licences, licence plates and vehicle registration. Each province has its own office.',
      patterns: [/serviceontario/i, /\bICBC\b/, /insurance corporation of british columbia/i, /registry agent/i, /driver['’]?s licen[cs]e/i, /licen[cs]e plate/i, /vehicle (?:registration|permit)/i, /ministry of transportation/i, /\bMTO\b/, /\bSGI\b/, /manitoba public insurance/i, /road test/i],
      letters: ['Renewal notice — your driver’s licence or plate sticker ends soon', 'Suspension notice — your licence is suspended, for example for unpaid fines or too many points', 'Road test or medical review — they want a test or a doctor’s report before you can keep driving'],
      tips: ['Newcomers can usually drive with a foreign licence only for a short time — often 60 or 90 days, depending on the province. Check the rules in your province early.', 'In some provinces, unpaid fines can stop you from renewing your licence or plates.'],
    },
    {
      id: 'property-tax',
      slug: 'property-tax',
      name: 'City tax office',
      local: 'City or town — property tax department',
      about: 'Sends the yearly property tax bill to home owners. Tenants don’t usually pay it directly.',
      patterns: [/property tax/i, /interim tax bill/i, /final tax bill/i, /tax roll/i, /assessment roll/i, /\bMPAC\b/, /bc assessment/i, /property assessment/i],
      letters: ['Interim or final tax bill — what you owe this year, and the due dates', 'Property assessment notice — the value they use to work out your tax', 'Overdue notice — a missed payment, with penalties added'],
      tips: ['Pay by the due dates on the bill. Many cities let you pay every month by pre-authorized debit.', 'If you think the value of your home is wrong, you can ask for a review. The assessment notice gives the deadline.'],
    },
    {
      id: 'bylaw',
      slug: 'parking-bylaw',
      name: 'City bylaw and parking office',
      local: 'City bylaw enforcement / parking',
      about: 'Enforces city rules, like parking, noise, garbage and snow removal. It sends parking tickets and bylaw fines.',
      patterns: [/by-?laws?\b/i, /parking (?:ticket|violation|infraction|tag|penalty)/i, /penalty notice/i, /administrative (?:monetary )?penalt/i, /parking enforcement/i, /municipal law enforcement/i, /screening review/i, /\btow(?:ed|ing)\b/i],
      letters: ['Parking ticket or penalty notice — a fine for breaking a parking rule', 'Bylaw notice or order — fix something, like snow, garbage or a fence, by a date', 'Notice of a higher fine — you didn’t pay or dispute in time'],
      tips: ['The ticket says how to pay or dispute it, and by when. Many cities let you ask for a review online.', 'In some provinces, unpaid parking fines must be paid before you can renew your licence plates.'],
    },
    {
      id: 'traffic-court',
      slug: 'traffic-ticket',
      name: 'Police and traffic court',
      local: 'Police service / Provincial Offences Court',
      about: 'Police write tickets for traffic and other provincial offences. The provincial offences court handles payments, disputes and trials.',
      patterns: [/offence notice/i, /provincial offences?/i, /violation ticket/i, /certificate of offence/i, /highway traffic act/i, /motor vehicle act/i, /traffic safety act/i, /police service/i, /\bRCMP\b/, /\bOPP\b/, /notice of trial/i, /early resolution/i, /\bspeeding\b/i, /red light camera/i, /automated speed enforcement/i],
      letters: ['Offence notice or violation ticket — a traffic fine', 'Notice of trial — the date of your court hearing', 'Notice of fine and due date — you were convicted and must pay by the date'],
      tips: ['You usually have only a short time to pay or dispute — for example 15 days in Ontario or 30 days in British Columbia. Check the back of the ticket.', 'If you do nothing, you can be convicted without a hearing, and demerit points may go on your driving record.'],
    },
    {
      id: 'court',
      slug: 'small-claims-court',
      name: 'Small claims court or tribunal',
      local: 'Small Claims Court / tribunal',
      about: 'Courts and tribunals for money and housing disputes, for example unpaid bills, damage or deposits. You can go without a lawyer.',
      patterns: [/small claims/i, /superior court of justice/i, /provincial court/i, /civil resolution tribunal/i, /\bplaintiff/i, /\bdefendant/i, /statement of claim/i, /notice of civil claim/i, /court file/i, /\btribunal\b/i, /notice of hearing/i, /settlement conference/i, /\bjudgment\b/i],
      letters: ['Plaintiff’s claim — someone is suing you for money', 'Notice of hearing or settlement conference — the date you must attend', 'Default judgment — the court decided against you because you didn’t answer'],
      tips: ['Answer by the deadline in the papers — for example 20 days in Ontario Small Claims Court. If you don’t, the court can decide without you.', 'Many community legal clinics and law school clinics give free help.'],
    },
    {
      id: 'collection-agency',
      slug: 'collection-agency',
      name: 'Debt collection agency',
      local: 'Collection agency',
      about: 'A company that collects unpaid debts for others, like phone companies, banks or utilities. It must be licensed in your province.',
      patterns: [/collection agency/i, /collections? (?:department|agent|agency)/i, /debt collect/i, /on behalf of our client/i, /your account has been (?:assigned|placed|transferred)/i, /original creditor/i, /settle (?:this|your) (?:account|debt)/i],
      letters: ['Collection notice — they say you owe money to another company', 'Settlement offer — they accept less if you pay now', 'Final notice — they say they may sue you or report you to a credit bureau'],
      tips: ['Ask for proof of the debt in writing before you pay. Don’t pay a debt you don’t recognize.', 'Collectors must follow provincial rules — for example, they can’t threaten you. A non-profit credit counsellor can help for free.'],
    },
    {
      id: 'landlord',
      slug: 'landlord',
      name: 'Landlord or property manager',
      local: 'Landlord / property management',
      about: 'The person or company you rent your home from. Tenancy rules and forms are different in each province.',
      patterns: [/\blandlord/i, /property manage/i, /\btenan(?:t|cy)/i, /residential tenanc/i, /landlord and tenant board/i, /\bLTB\b/, /residential tenancy branch/i, /\bN4\b/, /\bN5\b/, /\bN12\b/, /rent increase/i, /\blease\b/i],
      letters: ['Notice of rent increase — your rent goes up from a date', 'Notice to end your tenancy — for example an N4 or N12 form in Ontario', 'Notice of entry — they will come into your home, for example for repairs'],
      tips: ['A notice from your landlord is not an eviction order. In Ontario, only the Landlord and Tenant Board can order an eviction, and only the Sheriff can carry it out.', 'Check the deadlines on the form right away. In some provinces you have only a few days to dispute.'],
    },
    {
      id: 'utility',
      slug: 'utility',
      name: 'Electricity, gas or water company',
      local: 'Utility company (hydro, gas, water)',
      about: 'Sends bills for electricity (often called hydro), natural gas or water.',
      patterns: [/\bhydro\b/i, /\benbridge\b/i, /\bfortis/i, /\bepcor\b/i, /\bATCO\b/i, /\belectricity\b/i, /natural gas/i, /\bkWh\b/i, /meter read/i, /water (?:and|&) (?:sewer|wastewater)/i],
      letters: ['Bill — your usage and the amount due', 'Overdue notice — a missed payment, with late charges', 'Disconnection notice — they plan to cut off your service'],
      tips: ['If you can’t pay, call before the due date and ask for a payment arrangement. Many utilities and provinces have help programs for people with low income.', 'If you get a disconnection notice, call them the same day.'],
    },
    {
      id: 'student-aid',
      slug: 'student-loans',
      name: 'Student loans',
      local: 'National Student Loans Service Centre (NSLSC) / OSAP',
      about: 'Manages government student loans and grants, like Canada Student Loans and your province’s student aid.',
      patterns: [/national student loans service cent(?:re|er)/i, /\bNSLSC\b/, /canada student (?:loans?|grants?|financial assistance)/i, /\bOSAP\b/, /ontario student assistance/i, /student ?aid ?bc/i, /alberta student aid/i, /repayment assistance plan/i, /non-repayment period/i],
      letters: ['Repayment schedule — how much you pay each month, and from when', 'Repayment Assistance Plan (RAP) decision — lower or no payments if your income is low', 'Missed payment or default notice — you are behind on payments'],
      tips: ['Repayment usually starts 6 months after you finish school. Canada Student Loans no longer charge interest, but some provincial loans may.', 'If you can’t pay, apply for the Repayment Assistance Plan before you miss payments.'],
    },
    {
      id: 'workers-comp',
      slug: 'workers-compensation',
      name: 'Workplace injury insurance',
      local: 'WSIB / WorkSafeBC / WCB',
      about: 'Pays benefits and health costs if you are hurt or get sick because of your job.',
      patterns: [/\bWSIB\b/, /workplace safety and insurance board/i, /worksafebc/i, /\bWCB\b/, /workers['’]? compensation/i, /work-related injury|workplace injury/i],
      letters: ['Claim decision — whether they accept your claim', 'Request for information — they need forms or medical reports', 'Benefit letter — how much you get, and for how long'],
      tips: ['Tell your employer about a work injury right away, and see a doctor.', 'If you disagree with a decision, you can object — but the time limit can be short, for example 30 days for some decisions in Ontario.'],
    },
  ],
  kinds: [
    {
      id: 'assessment', type: 'tax-assessment', local: 'Notice of assessment / reassessment', name: 'Tax notice', about: 'The result after the CRA checked your tax return. It shows whether you owe money, get a refund, or owe nothing.', urgency: 'medium', patterns: [/notice of (?:re)?assessment/i, /we (?:have )?(?:re)?assessed your/i, /this (?:re)?assessment/i, /explanation of changes/i],
      steps: ['Check your income, credits and amounts. If something is wrong, you can ask for a change in My Account (“Change my return”) or file a notice of objection.', 'For a personal tax return, you can usually object until the later of: 90 days after the date of the notice, or 1 year after your filing due date (April 30 for most people).'],
    },
    { id: 'statement', type: 'reminder', local: 'Statement of account / overdue notice', name: 'Payment reminder', about: 'You still owe money. Interest or late fees are usually added until you pay.', urgency: 'high', patterns: [/statement of account/i, /\boverdue\b/i, /past due/i, /remains? unpaid/i, /\breminder\b/i, /we have not received (?:your )?payment/i, /\barrears\b/i, /outstanding (?:balance|amount)/i, /second notice|final notice/i] },
    { id: 'legal-warning', type: 'enforcement', local: 'Legal warning / requirement to pay', name: 'Collection action', about: 'They are about to take the money by force, for example from your wages or your bank account.', urgency: 'high', patterns: [/legal warning/i, /requirement to pay/i, /garnish/i, /writ of seizure/i, /legal action/i, /without further notice/i, /\bseize/i] },
    {
      id: 'review', type: 'documents', local: 'Review letter / request for information', name: 'Request for documents', about: 'They need papers or information from you before they can decide, or to check something you claimed.', urgency: 'medium', patterns: [/review letter/i, /we are (?:currently )?reviewing/i, /request for (?:additional )?(?:information|documents)/i, /please (?:send|submit|provide|upload) (?:us )?(?:the following|copies|documents)/i, /supporting documents/i, /additional (?:information|documents)/i, /missing (?:information|documents)/i, /submit documents/i],
      steps: ['Send exactly what they ask for, with your reference number on each page. You can usually upload documents online — in CRA My Account (“Submit documents”) or in your IRCC account.'],
    },
    {
      id: 'overpayment', type: 'repayment', local: 'Overpayment / notice of debt', name: 'Request to pay money back', about: 'They believe they paid you too much — for example EI, a pension or a benefit — and want the money back.', urgency: 'high', patterns: [/overpa(?:id|yment)/i, /notice of debt/i, /must (?:repay|pay back)/i, /\brepay\b/i, /benefit repayment/i],
      steps: ['Check the period and the amount. If you think they are wrong, ask for a reconsideration — for EI usually within 30 days after you got the decision.', 'If you can’t pay it all at once, ask for a payment arrangement. Money may also be taken from your future benefit payments.'],
    },
    {
      id: 'biometrics', type: 'appointment', local: 'Biometric instruction letter (BIL)', name: 'Biometrics instruction', about: 'IRCC asks you to give your fingerprints and photo. You usually have 30 days from the date of the letter.', urgency: 'high', patterns: [/biometric instruction letter/i, /\bBIL\b/, /give (?:your )?biometrics/i, /biometrics? (?:collection|appointment)/i, /fingerprints and (?:a )?(?:digital )?photo/i],
      steps: ['Book an appointment at a biometrics collection site — in Canada, many Service Canada offices — and go before the deadline (usually 30 days after the date of the letter). Bring the letter and your passport.'],
    },
    {
      id: 'interview', type: 'appointment', local: 'Interview notice / notice to appear', name: 'Appointment or interview', about: 'They want you to come to an interview, test or ceremony at a set date and time. Missing it without a good reason can delay your file or lead to a refusal.', urgency: 'medium', patterns: [/\binterview/i, /notice to appear/i, /you are (?:scheduled|invited|required) to (?:attend|appear)/i, /(?:has|have) been scheduled/i, /\bappointment\b/i, /oath ceremony|citizenship ceremony|citizenship test/i, /please (?:arrive|attend|bring)/i],
      steps: ['Bring every document listed in the letter, and arrive a little early.'],
    },
    {
      id: 'fairness', type: 'hearing', local: 'Procedural fairness letter', name: 'Chance to explain', about: 'They have concerns and may decide against you, but first give you a chance to answer in writing.', urgency: 'high', objection: false, patterns: [/procedural fairness/i, /fairness letter/i, /(?:we|the officer) (?:have|has) concerns/i, /opportunity to respond/i, /chance to respond/i, /\bmisrepresentation\b/i],
      steps: ['Answer before the deadline in the letter — it can be short. Answer each concern, give the facts and add proof.', 'Get help from a lawyer or a licensed immigration consultant (RCIC) if you can. This may be your last chance before they decide.'],
    },
    {
      id: 'refusal', type: 'rejection', local: 'Refusal letter', name: 'Rejection', about: 'Your application or claim was turned down. The letter should say if you can ask for a review, appeal or apply again.', urgency: 'medium', patterns: [/\brefus(?:ed|al)\b/i, /not (?:been )?approved/i, /(?:unable|not able) to approve/i, /does not meet the requirements/i, /(?:are|were) not eligible/i, /\bineligible\b/i, /\bdenied\b/i, /not entitled/i, /disentitle|disqualif/i],
      steps: ['Read the reasons and what the letter says about your options. For EI, CPP or OAS, ask for a reconsideration first.', 'For an immigration refusal, the deadline to go to the Federal Court is very short — 15 days for a decision made in Canada. Get legal help quickly.'],
    },
    { id: 'approval', type: 'approval', local: 'Approval / confirmation', name: 'Approval', about: 'Your application was accepted. The letter shows what you get, how much and from when.', urgency: 'low', patterns: [/(?<!not (?:been )?)\bapproved\b/i, /we are pleased to (?:inform|confirm|tell)/i, /congratulations/i, /confirmation of permanent residence/i, /\byou are eligible\b/i] },
    {
      id: 'ticket', type: 'fine', local: 'Ticket / offence notice / penalty notice', name: 'Fine or ticket', about: 'A fine for a traffic, parking or bylaw offence. You can pay it or dispute it — but only for a short time.', urgency: 'high', patterns: [/offence notice/i, /violation ticket/i, /parking (?:ticket|violation|infraction|tag)/i, /penalty notice/i, /set fine/i, /fine amount/i, /penalty amount/i, /\bspeeding\b/i, /red light camera/i, /automated speed enforcement/i, /victim fine surcharge/i, /demerit points?/i],
      steps: ['Choose before the deadline on the ticket: pay, or dispute it — for example ask for a meeting with a prosecutor, a review or a trial. If you do nothing, you can be convicted without a hearing and pay more.'],
    },
    {
      id: 'court-claim', type: 'court-order', local: 'Claim / notice of hearing', name: 'Court papers', about: 'Someone is taking you to court or a tribunal, or a hearing date was set. If you ignore it, they can decide against you.', urgency: 'high', objection: false, patterns: [/plaintiff['’]?s claim/i, /statement of claim/i, /notice of civil claim/i, /you are being sued/i, /\bdefendant\b/i, /notice of hearing/i, /settlement conference/i, /default judgment/i, /\bsummons\b/i],
      steps: ['Read it the same day. To defend yourself, you usually must file an answer (for example a Defence) within a short time — 20 days in Ontario Small Claims Court. A community legal clinic can help for free.'],
    },
    {
      id: 'eviction', type: 'termination', local: 'Notice to end your tenancy', name: 'Eviction notice', about: 'Your landlord wants to end your tenancy. The rules and forms are different in each province.', urgency: 'high', objection: false, extendable: false, patterns: [/notice to end (?:your |a |the )?tenancy/i, /\bN4\b/, /\bN5\b/, /\bN12\b/, /\bN13\b/, /\beviction\b/i, /\bevict/i, /termination date/i, /end (?:your|the) tenancy/i, /\bvacate\b/i, /move out by/i],
      steps: ['Don’t ignore it, and get free legal help quickly. Some deadlines are only a few days — for example 5 days to pay or dispute a 10-day notice for unpaid rent in British Columbia.', 'In Ontario, a notice alone can’t make you leave: the landlord must apply to the Landlord and Tenant Board, and only the Sheriff can carry out an eviction.'],
    },
    { id: 'utility-bill', type: 'utility-bill', local: 'Hydro, gas or water bill', name: 'Utility bill', about: 'A bill for electricity (hydro), natural gas or water. It shows your usage, the amount due and the due date.', urgency: 'medium', patterns: [/\bkWh\b/i, /electricity (?:charges|bill|usage)/i, /delivery charge/i, /meter read/i, /gas (?:supply|delivery|usage)/i, /hydro bill/i, /water (?:and|&) (?:sewer|wastewater)/i, /disconnect/i] },
    { id: 'bill', type: 'bill', local: 'Bill / invoice', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\binvoice\b/i, /your bill/i, /amount due/i, /bill date/i, /account summary/i, /due date/i] },
    {
      id: 'decision', type: 'decision', local: 'Decision letter', name: 'Official decision', about: 'A formal decision, for example on EI, a pension or a benefit. If you disagree, you can usually ask for a reconsideration or appeal — the letter says how and by when.', urgency: 'medium', weight: 0.5, patterns: [/\bdecision\b/i, /reconsideration/i, /we have decided/i],
      steps: ['Read the part that explains how to ask for a review or appeal. For EI, CPP and OAS you must first ask for a reconsideration — usually within 30 days for EI and 90 days for CPP and OAS.'],
    },
  ],
  references: [
    { name: 'Social insurance number', local: 'SIN', personal: true, pattern: /(?:[Ss]ocial [Ii]nsurance [Nn]umber|\bSIN\b)/g },
    { name: 'Business number', local: 'BN', pattern: /(?:business number|\bBN\b)/gi },
    { name: 'Unique client identifier', local: 'UCI', pattern: /(?:unique client identifier|\bUCI\b)/gi },
    { name: 'Application number', local: 'Application number', pattern: /application (?:number|no\b\.?|#)/gi },
    { name: 'Notice number', local: 'Notice number', pattern: /notice (?:number|no\b\.?|#)/gi },
    { name: 'File number', local: 'File number', pattern: /(?:file (?:number|no\b\.?|#)|case (?:number|no\b\.?|#)|reference (?:number|no\b\.?|#)|our file)/gi },
    { name: 'Claim number', local: 'Claim number', pattern: /claim (?:number|no\b\.?|#)/gi },
    { name: 'Ticket number', local: 'Ticket number', pattern: /(?:ticket|offence notice|violation|infraction|penalty notice) (?:number|no\b\.?|#)/gi },
    { name: 'Account number', local: 'Account number', pattern: /account (?:number|no\b\.?|#)/gi },
    { name: 'Invoice number', local: 'Invoice number', pattern: /(?:invoice|bill) (?:number|no\b\.?|#)/gi },
    { name: 'Client number', local: 'Client ID', pattern: /client (?:ID|identifier|number|no\b\.?)/gi },
  ],
  glossary: [
    { term: 'notice of assessment', slug: 'notice-of-assessment', pattern: /notice of assessment|\bNOA\b/i, meaning: 'The CRA’s answer after it processes your tax return. It shows your income, your tax, and whether you owe money or get a refund.', tip: 'Keep every notice. You often need it as proof of income, for example for a lease, a loan or an immigration application.' },
    { term: 'notice of reassessment', slug: 'notice-of-reassessment', pattern: /\breassess/i, meaning: 'A new tax notice after the CRA changed your return — because you asked, or after a review. It replaces the earlier notice.' },
    { term: 'notice of objection', slug: 'notice-of-objection', pattern: /notice of objection|formal dispute/i, meaning: 'A formal complaint that a CRA tax decision is wrong. An appeals officer who was not part of the first decision looks at it.', tip: 'For a personal tax notice you usually have until the later of 90 days after the date of the notice or 1 year after your filing due date. File it in My Account or with form T400A.' },
    { term: 'My Account', slug: 'my-account', pattern: /\bmy account\b/i, meaning: 'The CRA’s secure online service. You can see your notices, your balance and your benefit payments, and send documents.', tip: 'Sign up for online mail. Many CRA letters arrive there first, and you get an email when a new one is ready.' },
    { term: 'balance owing', slug: 'balance-owing', pattern: /balance owing|amount owing/i, meaning: 'Money you still owe. Interest is usually added every day until it is paid.' },
    { term: 'arrears', slug: 'arrears', pattern: /\barrears\b/i, meaning: 'Money that is overdue, for example unpaid tax, rent or bills.' },
    { term: 'instalments', slug: 'instalments', pattern: /\binstal?lments?\b/i, meaning: 'Payments in parts. On CRA letters it means paying your tax in parts during the year, often every three months, because not enough tax is taken off your income.' },
    { term: 'payment arrangement', slug: 'payment-arrangement', pattern: /payment arrangement|payment plan/i, meaning: 'An agreement to pay a debt in smaller amounts over time.', tip: 'Ask before the due date. For CRA debts you can often set one up in My Account or by phone. Interest usually keeps running.' },
    { term: 'garnishment', slug: 'garnishment', pattern: /garnish/i, meaning: 'Taking money straight from your wages or bank account to pay a debt.' },
    { term: 'legal warning', slug: 'legal-warning', pattern: /legal warning/i, meaning: 'A last warning from the CRA before it takes legal action to collect a debt, for example by garnishing your wages or bank account.' },
    { term: 'requirement to pay', slug: 'requirement-to-pay', pattern: /requirement to pay/i, meaning: 'A legal order from the CRA to your employer, your bank or someone else who owes you money, to pay the CRA instead of you.' },
    { term: 'taxpayer relief', slug: 'taxpayer-relief', pattern: /taxpayer relief|\bRC4288\b/i, meaning: 'A request to the CRA to cancel penalties or interest when you couldn’t pay or file on time for reasons outside your control. It can’t cancel the tax itself.' },
    { term: 'Receiver General for Canada', slug: 'receiver-general', pattern: /receiver general/i, meaning: 'The name to use for payments to the federal government, for example on a cheque to the CRA.' },
    { term: 'CCB', slug: 'ccb', pattern: /\bCCB\b|canada child benefit/i, meaning: 'Canada Child Benefit. A tax-free monthly payment for families with children under 18.', tip: 'You and your spouse or partner must both file a tax return every year, even with no income, or the payments can stop.' },
    { term: 'GST/HST credit', slug: 'gst-hst-credit', pattern: /GST\/HST credit|\bGST credit|groceries and essentials benefit/i, meaning: 'A tax-free payment every three months for people with low or modest income. You get it by filing your tax return.' },
    { term: 'T4 slip', slug: 't4', pattern: /\bT4\b/, meaning: 'A form from your employer that shows your pay and the tax taken off it for the year. You need it for your tax return.' },
    { term: 'T1 return', slug: 't1', pattern: /\bT1\b|income tax and benefit return/i, meaning: 'Your personal income tax and benefit return. Most people must file it by April 30 each year.' },
    { term: 'RRSP', slug: 'rrsp', pattern: /\bRRSP\b|registered retirement savings plan/i, meaning: 'Registered Retirement Savings Plan. Savings for retirement. Money you put in lowers your taxable income.' },
    { term: 'TFSA', slug: 'tfsa', pattern: /\bTFSA\b|tax-free savings account/i, meaning: 'Tax-Free Savings Account. Money that grows in it is not taxed. Putting in more than your limit leads to a penalty tax.' },
    { term: 'SIN', slug: 'sin', pattern: /\bSIN\b|social insurance number/i, meaning: 'Social Insurance Number. Your 9-digit number for work, taxes and benefits.', tip: 'Keep it private. Give it only when you must, for example to your employer, your bank or a government office. A SIN that starts with 9 is for temporary residents and has an expiry date.' },
    { term: 'UCI', slug: 'uci', pattern: /\bUCI\b|unique client identifier/i, meaning: 'Unique Client Identifier. Your IRCC client number. It has 8 or 10 digits and stays the same for all your applications.' },
    { term: 'IRCC', slug: 'ircc', pattern: /\bIRCC\b|immigration, refugees and citizenship canada/i, meaning: 'Immigration, Refugees and Citizenship Canada. The federal office for visas, permits, permanent residence and citizenship.' },
    { term: 'biometrics', slug: 'biometrics', pattern: /biometric/i, meaning: 'Your fingerprints and a digital photo, taken for an immigration application.', tip: 'After the instruction letter you usually have 30 days to give them. Book an appointment, and bring the letter and your passport.' },
    { term: 'procedural fairness letter', slug: 'procedural-fairness-letter', pattern: /procedural fairness|fairness letter/i, meaning: 'A letter from IRCC saying it has concerns about your application. It gives you a chance to answer before it decides.', tip: 'Answer before the deadline in the letter, with facts and proof. Get help from a lawyer or a licensed immigration consultant (RCIC) if you can.' },
    { term: 'PR card', slug: 'pr-card', pattern: /\bPR card\b|permanent resident card/i, meaning: 'Permanent Resident card. It proves your status when you travel back to Canada. The card usually expires after 5 years, but your status does not end with it.' },
    { term: 'COPR', slug: 'copr', pattern: /\bCOPR\b|confirmation of permanent residence/i, meaning: 'Confirmation of Permanent Residence. The paper you get when your permanent residence is approved, before your PR card.' },
    { term: 'work permit', slug: 'work-permit', pattern: /work permit/i, meaning: 'A paper that lets a temporary resident work in Canada. Read its conditions, like which employer and until when.' },
    { term: 'study permit', slug: 'study-permit', pattern: /study permit/i, meaning: 'A paper that lets you study at a school in Canada. It is not a visa to enter Canada.' },
    { term: 'maintained status', slug: 'maintained-status', pattern: /maintained status|implied status/i, meaning: 'If you apply to extend your permit before it expires, you can usually stay — and often keep working or studying — under the same conditions while you wait.', tip: 'It only works if you applied before your permit expired and you stay in Canada. Keep proof of the date you applied.' },
    { term: 'EI', slug: 'ei', pattern: /\bEI\b|employment insurance/i, meaning: 'Employment Insurance. Payments for a short time if you lose your job, are sick, have a baby or care for a family member.' },
    { term: 'ROE', slug: 'roe', pattern: /\bROE\b|record of employment/i, meaning: 'Record of Employment. Your employer sends it to Service Canada when your work stops. It is used to decide your EI.' },
    { term: 'notice of debt', slug: 'notice-of-debt', pattern: /notice of debt/i, meaning: 'A letter saying you owe money to the government, for example after an EI overpayment.' },
    { term: 'overpayment', slug: 'overpayment', pattern: /overpa(?:id|yment)/i, meaning: 'Money you got but were not entitled to, for example too much EI or benefits. You usually must pay it back.' },
    { term: 'reconsideration', slug: 'reconsideration', pattern: /reconsideration/i, meaning: 'A request to look at a decision again, for example on EI, CPP or OAS. You must ask for it before you can go to the Social Security Tribunal.', tip: 'For EI you usually have 30 days after you got the decision. For CPP and OAS you usually have 90 days.' },
    { term: 'appeal', slug: 'appeal', pattern: /\bappeal/i, meaning: 'Asking a tribunal, court or higher office to change a decision.' },
    { term: 'Social Security Tribunal', slug: 'social-security-tribunal', pattern: /social security tribunal/i, meaning: 'An independent tribunal that hears appeals about EI, CPP and OAS decisions, after a reconsideration.' },
    { term: 'OAS', slug: 'oas', pattern: /\bOAS\b|old age security/i, meaning: 'Old Age Security. A monthly pension from age 65. It depends on how many years you lived in Canada after age 18, not on your work.' },
    { term: 'CPP', slug: 'cpp', pattern: /\bCPP\b|canada pension plan/i, meaning: 'Canada Pension Plan. A pension based on what you paid in from your work. Quebec has its own plan (QPP).' },
    { term: 'health card', slug: 'health-card', pattern: /health card|\bOHIP\b|\bMSP\b|\bAHCIP\b|BC services card/i, meaning: 'The card for your province’s public health insurance, for example OHIP in Ontario or MSP in British Columbia. Show it at the doctor or hospital.', tip: 'Some provinces have a waiting period of up to about 3 months for new residents. Get private insurance until your cover starts.' },
    { term: 'provincial offence', slug: 'provincial-offence', pattern: /provincial offences?/i, meaning: 'Breaking a provincial law, like most traffic rules. It does not give you a criminal record.' },
    { term: 'demerit points', slug: 'demerit-points', pattern: /demerit points?|penalty points?/i, meaning: 'Points added to your driving record for some traffic offences. Too many points can lead to a warning, a meeting or a suspended licence.' },
    { term: 'bylaw', slug: 'bylaw', pattern: /by-?laws?\b/i, meaning: 'A city rule, for example about parking, noise, garbage or snow removal.' },
    { term: 'small claims court', slug: 'small-claims-court', pattern: /small claims/i, meaning: 'A simpler court for smaller money disputes. You can go without a lawyer.' },
    { term: 'N4', slug: 'n4', pattern: /\bN4\b/, meaning: 'In Ontario: a notice from your landlord to end your tenancy because rent is unpaid.', tip: 'If you pay all the rent you owe before the termination date on the notice, the notice no longer counts. You don’t have to move out just because you got it.' },
    { term: 'N12', slug: 'n12', pattern: /\bN12\b/, meaning: 'In Ontario: a notice to end your tenancy because the landlord, a buyer or a close family member wants to move in. You must get at least 60 days’ notice and usually one month’s rent as compensation.' },
    { term: 'Landlord and Tenant Board', slug: 'landlord-and-tenant-board', pattern: /landlord and tenant board|\bLTB\b/i, meaning: 'The Ontario tribunal that decides disputes between landlords and tenants, including evictions. Other provinces have similar offices, like the Residential Tenancy Branch in British Columbia.' },
    { term: 'last month’s rent deposit', slug: 'last-months-rent-deposit', pattern: /last month['’]?s rent/i, meaning: 'In Ontario, a deposit of up to one month’s rent, used only for your last month. Landlords in Ontario can’t ask for a damage deposit.' },
    { term: 'pre-authorized debit', slug: 'pre-authorized-debit', pattern: /pre-?authori[sz]ed (?:debit|payment)/i, meaning: 'Automatic payments taken from your bank account on set dates.' },
    { term: 'hydro', slug: 'hydro', pattern: /\bhydro\b/i, meaning: 'Electricity. In several provinces people call the power bill the hydro bill.' },
  ],
  replies: {
    objection: {
      subject: (term, of) => `Re: ${term[0].toUpperCase()}${term.slice(1)} — your decision ${of}`,
      body: (term, of) => [
        `Please accept this letter as my ${term} about your decision ${of}.`,
        '',
        'Reasons: [Explain in a few sentences why the decision is wrong. Give the facts, and attach copies of any proof.]',
        '',
        'Please confirm that you received this letter.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'taxpayer-relief',
      title: 'Ask to cancel penalties or interest (taxpayer relief)',
      advice: 'Use this if you couldn’t pay or file on time because of something outside your control, like a serious illness, a disaster or money problems. It can only cancel penalties and interest, not the tax itself. You can also use form RC4288 or My Account.',
      english: 'I ask you to cancel the penalties and interest on my account. I couldn’t pay or file on time because [reason]. I attach proof.',
      subject: 'Re: Request for taxpayer relief — cancel penalties and interest',
      body: (result) => [
        `Your notice ${letterOf(result)} shows a balance owing of ${amountOf(result)}.`,
        'I could not pay or file on time because [reason, for example: I was seriously ill / I lost my job / there was a family emergency].',
        '',
        'I ask you to cancel or reduce the penalties and interest on my account under the taxpayer relief provisions.',
        '',
        'I attach proof: [list your documents].',
      ],
      when: (result) => result.sender?.id === 'cra' && Boolean(result.money?.toPay),
    },
  ],
  samples: [
    {
      id: 'cra',
      title: 'Canada Revenue Agency',
      subtitle: 'Tax notice with a balance owing',
      build(today) {
        const letter = lastWorkday(addDays(today, -3));
        const due = nextWorkday(addDays(letter, 34));
        const year = Number(today.slice(0, 4)) - 1;
        return `Canada Revenue Agency
Agence du revenu du Canada
Sudbury Tax Centre

Notice of reassessment

Date issued: ${writtenDate(letter, true)}
Tax year: ${year}
Social insurance number: XXX XX4 321

Priya Example
45 Example Street, Unit 1200
Toronto ON M4M 1A1

We reassessed your ${year} income tax and benefit return. Your employer sent us a T4 slip with employment income that was not on your return. We added this income and changed your tax.

Summary
Total income (line 15000): 52,480.00
Total payable (line 43500): 9,876.54
Total credits (line 48200): 8,641.98
Balance owing: $1,234.56

Pay by: ${isoDate(due)}

To avoid more interest, please pay the balance owing by ${isoDate(due)}. We charge interest every day on any amount you have not paid. You can pay online through your bank, in My Account at canada.ca/my-cra-account, or by cheque made payable to the Receiver General for Canada.

If you can’t pay the full amount, you may be able to set up a payment arrangement in My Account or by phone.

If you disagree with this reassessment, you can file a notice of objection within 90 days after the date of this notice, or within one year after the due date of your ${year} return, whichever is later. You can object online in My Account (Register my formal dispute) or with Form T400A.

Keep this notice. You may need it as proof of income.

Canada Revenue Agency`;
      },
    },
    {
      id: 'ircc',
      title: 'Immigration office (IRCC)',
      subtitle: 'Interview notice',
      build(today) {
        const letter = lastWorkday(addDays(today, -6));
        const interview = nextWorkday(addDays(today, 8));
        return `Immigration, Refugees and Citizenship Canada
Immigration, Réfugiés et Citoyenneté Canada

Date: ${writtenDate(letter)}
UCI: 1234-5678
Application number: E001234567

Ahmed Example
78 Sample Avenue, Apt. 5
Mississauga ON L5B 0A1

Subject: Interview notice — application for permanent residence (spouse or common-law partner in Canada class)

Dear Ahmed Example,

We are processing your application for permanent residence. An officer would like to meet with you and your sponsor in person.

Your interview is scheduled on ${writtenDate(interview)} at 9:30 a.m. at the following office:
IRCC Mississauga Office
100 Example Road, Suite 300
Mississauga ON L5B 0A2

Please bring:
- this letter
- your passport, and your sponsor’s passport or PR card
- the originals of the documents you sent with your application
- photos and messages that show your relationship

Please arrive 15 minutes early. Only the people named in this letter can come into the interview room.

If you cannot attend, tell us before the date of the interview using the IRCC Web form on canada.ca. If you do not come and do not contact us, we may make a decision on your application based on the information we have.

Sincerely,

Immigration, Refugees and Citizenship Canada`;
      },
    },
  ],
};
