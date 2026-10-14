import { addDays, formatLocalDate, fromIso } from '../dates.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function usDate(iso) {
  return formatLocalDate(iso, '/', 'mdy');
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function letterOf(result) {
  return result.letterDate ? `dated ${usDate(result.letterDate)}` : 'dated [MM/DD/YYYY]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('en-US', { style: 'currency', currency: money.currency ?? 'USD' }).format(money.amount) : '[amount]';
}

export default {
  id: 'us',
  slug: 'united-states',
  name: 'United States',
  inName: 'the United States',
  short: 'USA',
  adjective: 'American',
  flag: '🇺🇸',
  language: 'en',
  currency: 'USD',
  decimal: '.',
  thousands: ',',
  dateSeparator: '/',
  dateOrder: 'mdy',
  ibanLength: 0,
  intro: 'In the US, many deadlines count from the date printed on the notice, not from the day it arrives — so open official mail right away. Rules often differ from state to state, so always check the dates and instructions in your letter.',
  signals: [
    /\bInternal Revenue Service\b|\bIRS\b/,
    /\bUSCIS\b|Citizenship and Immigration Services/i,
    /Social Security (?:Administration|number)|\bSSN\b/i,
    /Department of (?:the Treasury|Homeland Security|Motor Vehicles|Labor)\b/i,
    /\.gov\b/i,
    /\bU\.S\.(?:A\.)?/,
    /\bUnited States\b/,
    /\b(?:A[LKZR]|C[AOT]|D[EC]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|PR|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]),?\s+\d{5}(?:-\d{4})?\b/,
    /(?<![\w*-])(?:XXX|\*{3}|\d{3})-(?:XX|\*{2}|\d{2})-\d{4}\b/,
    /\bUSD\b|US\$/,
    /\b(?:Medicaid|Medicare|SNAP|DMV|ZIP)\b/,
  ],
  deliveryDays: 0,
  deliveryNote: 'In the US, many deadlines count from the date printed on the notice, not from the day it arrives. Some offices add a few days for mail (Social Security assumes 5 days), and court deadlines usually start on the day you were served.',
  objectionAdvice: 'Use this if you think the decision is wrong. Check the letter first: many US offices want their own form or an online request. Send it before the deadline and keep proof, for example by certified mail.',
  deadlineWords: ['respond by', 'pay by', 'no later than', 'within', 'deadline'],
  objection: [
    { word: 'appeal', pattern: /\bappeal/i },
    { word: 'request for reconsideration', pattern: /reconsideration/i },
    { word: 'dispute', pattern: /\bdispute/i },
    { word: 'protest', pattern: /\bprotest/i },
    { word: 'hearing request', pattern: /request (?:a|for a|an administrative) hearing|hearing request|right to a hearing/i },
  ],
  help: {
    debt: 'a nonprofit credit counseling agency (for example a member of the NFCC)',
    tenant: 'a local tenant union or legal aid office',
    instalments: 'installment agreement',
    general: 'a legal aid office, or for tax problems a Low Income Taxpayer Clinic or the Taxpayer Advocate Service',
  },
  cancelTips: [
    'If you signed up for a subscription online, the company must give you a simple way to stop the payments.',
  ],
  senders: [
    {
      id: 'irs',
      slug: 'irs',
      name: 'Federal tax agency',
      local: 'Internal Revenue Service (IRS)',
      about: 'The federal tax office. It handles income tax returns, refunds and tax debts.',
      patterns: [/internal revenue service/i, /\bIRS\b/, /irs\.gov/i, /department of the treasury/i, /\bCP\s?\d{2,4}[A-Z]?\b/, /\bLT\s?11\b/, /\bletter (?:1058|3172|3219|4883C|5071C|5747C)\b/i, /\bform (?:1040|843|9465|12153)\b/i, /taxpayer advocate/i],
      letters: ['CP14, CP501, CP503 — you owe tax; each reminder is stronger than the last', 'CP2000 — they propose changes because your return doesn’t match what employers or banks reported', 'CP504, LT11 or Letter 1058 — they plan to take money (levy); LT11 and Letter 1058 give you the right to a hearing', 'Letter 5071C — they need to confirm your identity before they process your return'],
      tips: ['The IRS usually writes to you first by mail. It never asks you to pay with gift cards, prepaid debit cards or crypto.', 'Pay only on IRS.gov/payments, or by check to “United States Treasury”.'],
    },
    {
      id: 'state-tax',
      slug: 'state-tax-agency',
      name: 'State tax agency',
      local: 'State Department of Revenue or Taxation',
      about: 'Your state’s tax office. Most states have their own income tax, with their own forms and deadlines.',
      patterns: [/department of (?:revenue|taxation)/i, /franchise tax board/i, /\bFTB\b/, /division of taxation/i, /state (?:income )?tax/i, /comptroller/i, /tax commission/i],
      letters: ['Notice of balance due — you owe state tax', 'Notice of proposed assessment — they want more tax; you can usually protest by the date in the notice', 'Refund offset notice — your state refund was used to pay a debt'],
      tips: ['State rules and deadlines are different from the IRS. Follow the dates in the state’s letter.', 'Moved to another state? You may still get letters from your old state for the years you lived there.'],
    },
    {
      id: 'ssa',
      slug: 'social-security-administration',
      name: 'Social Security office',
      local: 'Social Security Administration (SSA)',
      about: 'Pays retirement, disability and survivor benefits, and SSI for older or disabled people with low income. It also issues Social Security numbers.',
      patterns: [/social security administration/i, /\bSSA\b/, /ssa\.gov/i, /\bSSI\b/, /supplemental security income/i, /social security (?:benefits?|payments?|disability)/i, /notice of (?:award|planned action)/i],
      letters: ['Notice of Award — your benefit amount and when payments start', 'Notice of Overpayment — they paid you too much and want it back', 'Notice of Planned Action — they plan to change or stop your SSI', 'Request for information — they need papers or answers from you'],
      tips: ['You usually have 60 days to appeal. Social Security assumes you got the letter 5 days after the date on it.', 'Report changes like a new job, a move or a marriage quickly. Late reports are a common cause of overpayments.'],
    },
    {
      id: 'uscis',
      slug: 'uscis',
      name: 'Immigration services',
      local: 'U.S. Citizenship and Immigration Services (USCIS)',
      about: 'Decides on green cards, work permits, citizenship and other immigration applications.',
      patterns: [/\bUSCIS\b/, /citizenship and immigration services/i, /department of homeland security/i, /\bI-797[A-E]?\b/i, /notice of action/i, /application support center/i, /\bA-Number\b/i, /\bI-\d{3}[A-Z]?\b/],
      letters: ['I-797C receipt notice — they got your application; it shows your receipt number', 'Biometrics appointment notice — go to have your fingerprints and photo taken', 'Request for Evidence (RFE) or Notice of Intent to Deny (NOID) — they need more proof before they decide', 'Approval or denial notice — the decision on your case'],
      tips: ['Check your case status online at uscis.gov with your receipt number.', 'If you move, tell USCIS your new address within 10 days.'],
    },
    {
      id: 'court',
      slug: 'court',
      name: 'Court',
      local: 'County or State Court',
      about: 'A court. Court papers are always important — never ignore them.',
      patterns: [/(?:superior|district|circuit|municipal|county|justice|civil|family|housing) court/i, /court of common pleas/i, /small claims/i, /clerk of (?:the )?court/i, /\bplaintiff\b/i, /\bdefendant\b/i, /\bsummons\b/i, /jury (?:summons|service|duty)/i, /\bdocket\b/i],
      letters: ['Summons and complaint — you are being sued; you must answer in writing', 'Jury summons — you are called for jury duty', 'Notice of hearing — you must come to court on a set date', 'Judgment — the court’s decision'],
      tips: ['Court deadlines are strict. If you miss one, you can lose without being heard.', 'Many courts have a free self-help center. If your income is low, legal aid can help for free.'],
    },
    {
      id: 'debt-collector',
      slug: 'debt-collector',
      name: 'Debt collector',
      local: 'Debt collection agency',
      about: 'A company that collects debts for others, or that bought an old debt. Check that the debt is really yours before you pay.',
      patterns: [/debt collector/i, /collection agency/i, /attempt to collect a debt/i, /\bcollections? (?:agency|department|account)/i, /original creditor/i, /\bcreditor\b/i, /recovery (?:services|solutions|group)/i, /validation notice/i, /itemization date/i],
      letters: ['Validation notice — who they are, how much they say you owe, and the date until which you can dispute', 'Settlement offer — they offer to accept less than the full amount', 'Notice of lawsuit — they plan to sue you, or already did'],
      tips: ['You can dispute the debt in writing by the date in the validation notice. There is a ready-made letter for this.', 'Old debts may be too old to sue over (statute of limitations). Paying even a little can sometimes restart the clock — get advice first.'],
    },
    {
      id: 'landlord',
      slug: 'landlord',
      name: 'Landlord or property manager',
      local: 'Landlord / property management',
      about: 'The owner of your home, or the company that manages it.',
      patterns: [/\blandlord\b/i, /property management/i, /property manager/i, /\btenants?\b/i, /\blease\b/i, /rental agreement/i, /security deposit/i, /\brent\b/i, /notice to (?:pay rent|quit|vacate)/i],
      letters: ['Notice to pay rent or quit — pay what you owe within a few days, or the landlord can go to court', 'Rent increase notice — your rent will go up', 'Lease renewal or non-renewal — your lease continues or ends', 'Security deposit statement — what they keep from your deposit and why'],
      tips: ['Usually only a court can make you leave. A landlord who changes the locks or removes your things without a court order is usually breaking the law.', 'Rules for notices, rent and deposits differ by state and city. A tenant union or legal aid office can check yours.'],
    },
    {
      id: 'utility',
      slug: 'utility-company',
      name: 'Electric, gas or water company',
      local: 'Utility company',
      about: 'The company that sells you electricity, gas or water.',
      patterns: [/\butilit(?:y|ies)\b/i, /electric(?:ity)? (?:service|company|bill|usage)/i, /\bgas (?:service|company|bill|usage)\b/i, /water (?:service|department|bill|usage)/i, /\bkWh\b/i, /meter (?:reading|number)/i, /disconnect(?:ion)?/i, /shut-?off/i, /service address/i],
      letters: ['Monthly bill — what you used and when to pay', 'Past-due or disconnection notice — they plan to cut your service if you don’t pay', 'Deposit request — some companies ask new customers for a deposit'],
      tips: ['Call before the shutoff date and ask for a payment arrangement. Many states limit shutoffs in extreme weather or when someone is seriously ill.', 'If your income is low, ask about help programs such as LIHEAP, which helps pay energy bills.'],
    },
    {
      id: 'health',
      slug: 'health-insurance',
      name: 'Health insurance',
      local: 'Health insurer / Medicaid / Marketplace',
      about: 'Your health insurance company, or a public program like Medicaid or a Marketplace plan from HealthCare.gov or your state.',
      patterns: [/\bmedicaid\b/i, /\bmedicare\b/i, /\bCHIP\b/, /health insurance marketplace/i, /healthcare\.gov/i, /explanation of benefits/i, /\bEOB\b/, /health (?:plan|insurance|coverage)/i, /member id/i, /\bdeductible\b/i, /\bcopay/i, /\bpremiums?\b/i],
      letters: ['Explanation of Benefits (EOB) — what your insurer paid; it is not a bill', 'Renewal notice — Medicaid or Marketplace coverage must be renewed by a set date', 'Denial of coverage — they won’t pay for a treatment; you can appeal', 'Premium bill — your monthly payment'],
      tips: ['An EOB is not a bill. Wait for the bill from the doctor or hospital, and compare the two.', 'Answer Medicaid renewal letters by the date given, or your coverage can end.'],
    },
    {
      id: 'benefits',
      slug: 'social-services',
      name: 'Social services (food and cash help)',
      local: 'Department of Human Services / Social Services',
      about: 'Your state or county office for SNAP (food help), cash help and often Medicaid.',
      patterns: [/\bSNAP\b/, /[Ff]ood [Ss]tamps/, /\bEBT\b/, /human services/i, /social services/i, /\bTANF\b/, /cash assistance/i, /\bWIC\b/, /notice of (?:adverse|proposed) action/i, /recertif/i],
      letters: ['Approval notice — your benefits and the amount', 'Interview notice — a required phone or office interview', 'Recertification notice — renew by the date, or your benefits stop', 'Notice of adverse action — they plan to cut or stop your benefits; you can ask for a fair hearing'],
      tips: ['If they plan to cut or stop your benefits, ask for a fair hearing quickly. If you ask before the change starts, your benefits can often continue until the decision.'],
    },
    {
      id: 'unemployment',
      slug: 'unemployment-office',
      name: 'Unemployment office',
      local: 'State unemployment insurance agency',
      about: 'Your state office that pays unemployment benefits after you lose your job.',
      patterns: [/unemployment (?:insurance|benefits?|compensation|claim)/i, /department of labor/i, /employment security/i, /workforce (?:commission|development|services)/i, /employment development department/i, /\bEDD\b/, /weekly (?:claim|certification)/i, /\bclaimant\b/i, /monetary determination/i],
      letters: ['Monetary determination — whether you earned enough to get benefits, and how much', 'Notice of determination — a decision on your claim; you can appeal', 'Overpayment notice — they paid you too much', 'Interview notice — a phone call about why your job ended'],
      tips: ['Appeal deadlines are short and differ by state — in some states only about 10 days. Use the date in the letter.', 'Keep filing your weekly claims while you wait for a decision or an appeal.'],
    },
    {
      id: 'student-loans',
      slug: 'student-loan-servicer',
      name: 'Student loan company',
      local: 'Student loan servicer',
      about: 'The company that collects your student loan payments, for the government or a private lender.',
      patterns: [/student loans?/i, /loan servic(?:er|ing)/i, /federal student aid/i, /studentaid\.gov/i, /income-driven repayment/i, /\bIDR\b/, /forbearance/i, /deferment/i, /\bdefault(?:ed)? (?:loan|status)/i],
      letters: ['Billing statement — your monthly payment and due date', 'Repayment plan notice — your plan or payment changes', 'Delinquency or default notice — you missed payments'],
      tips: ['If you can’t pay, ask about an income-driven repayment plan, deferment or forbearance before you miss payments.', 'Federal student loans in default can lead to your tax refund being taken and to wage garnishment without a court case.'],
    },
    {
      id: 'property-tax',
      slug: 'property-tax-office',
      name: 'Property tax office',
      local: 'County Assessor / Tax Collector',
      about: 'Your county or city office that values homes and land and collects property tax.',
      patterns: [/property tax/i, /\bassessor\b/i, /tax collector/i, /assessed value/i, /\bparcel\b/i, /real estate tax/i, /\btreasurer\b/i, /\bhomestead\b/i],
      letters: ['Property tax bill — what you owe and the due dates, often in two parts', 'Notice of assessed value — what they think your property is worth; you can appeal', 'Delinquent tax notice — unpaid tax with penalties'],
      tips: ['If you think the value is too high, you can appeal. The time to do it is short and set by your county.', 'If your mortgage company pays the tax for you (escrow), check that it was paid.'],
    },
    {
      id: 'dmv',
      slug: 'dmv',
      name: 'Driver and vehicle office',
      local: 'Department of Motor Vehicles (DMV)',
      about: 'Your state office for driver’s licenses, ID cards and car registration. Some states call it RMV, BMV or MVD.',
      patterns: [/department of motor vehicles/i, /\bDMV\b/, /\bRMV\b/, /\bBMV\b/, /\bMVD\b/, /(?:registry|bureau) of motor vehicles/i, /motor vehicle division/i, /driver[’']?s? licen[cs]e/i, /vehicle registration/i, /\bREAL ID\b/i],
      letters: ['Registration renewal — your car registration ends soon', 'Suspension notice — your driver’s license will be suspended, often for unpaid tickets or missing insurance', 'Request for documents — they need proof before they issue a license or REAL ID'],
      tips: ['After you become a resident, you usually have only a short time to switch to a license from your state. Check your state’s rules.', 'Tell the DMV when you move. Most states set a short deadline for this.'],
    },
    {
      id: 'parking',
      slug: 'parking-and-traffic-tickets',
      name: 'Parking and traffic tickets',
      local: 'Police / parking enforcement',
      about: 'Gives out parking and traffic tickets (citations) for the city, county or state.',
      patterns: [/parking (?:ticket|citation|violation|enforcement)/i, /traffic (?:ticket|citation|violation)/i, /notice of (?:parking )?violation/i, /\bcitation\b/i, /police department/i, /highway patrol/i, /red light|speed(?:ing)? camera/i, /license plate/i, /\btolls?\b/i],
      letters: ['Parking ticket — pay or contest by the date', 'Traffic ticket — pay, or go to court to fight it', 'Camera violation notice — a camera caught your car running a red light or speeding'],
      tips: ['Pay or contest only through the official website or address on the ticket. Text messages about unpaid tolls or tickets are often scams.', 'If you ignore a ticket, the fine usually goes up. Unpaid traffic tickets can lead to a suspended license.'],
    },
  ],
  kinds: [
    {
      id: 'levy', type: 'enforcement', local: 'Notice of intent to levy / garnishment', name: 'Enforcement notice', about: 'They plan to take money by force, or have started — for example from your bank account, wages or benefits (a levy or garnishment).', urgency: 'high', patterns: [/intent to levy/i, /\blev(?:y|ies|ied)\b/i, /garnish/i, /\bLT11\b/, /letter 1058/i, /\bCP504\b/, /\bseiz(?:e|ure)\b/i, /(?:wage|earnings) (?:withholding|assignment) order/i, /writ of (?:execution|garnishment)/i],
      steps: ['If this is an IRS final notice (LT11 or Letter 1058), you can ask for a Collection Due Process hearing. Send Form 12153 within 30 days of the date on the letter.', 'Some money is protected, for example Social Security benefits from most private creditors. Ask legal aid how to claim an exemption — the time to do it is often short.'],
    },
    {
      id: 'summons', type: 'court-order', local: 'Summons and complaint', name: 'Court case against you', about: 'Someone is suing you. You must file a written answer with the court by the deadline, or you can lose automatically.', urgency: 'high', objection: false, instalments: false, patterns: [/\bsummons\b/i, /\bplaintiff\b/i, /\bdefendant\b/i, /you (?:are being|have been) sued/i, /\blawsuit\b/i, /civil (?:action|case)/i, /answer (?:the complaint|in writing)/i, /default judgment/i, /unlawful detainer/i],
      steps: ['File a written answer with the court by the deadline on the summons — often 20 to 30 days after you got the papers, sometimes much less. If you don’t, the court can decide against you without hearing you (default judgment).', 'Get free legal help today, for example from a legal aid office. Many courts also have a free self-help center.'],
    },
    {
      id: 'balance-due', type: 'reminder', local: 'Balance due / past-due notice', name: 'Payment reminder', about: 'You owe money that was due before, for example tax or a bill. Interest, penalties or late fees can grow until you pay.', urgency: 'high', patterns: [/balance due/i, /\bCP(?:14|161|501|503)\b/, /unpaid (?:tax|taxes|balance|amount)/i, /past[- ]due/i, /\boverdue\b/i, /failure[- ]to[- ]pay penalty/i, /pay the (?:amount|balance) due/i, /payment reminder/i],
      steps: ['Penalties and interest grow until you pay. If you had a good reason for paying late, you can ask them to remove the penalty.', 'For IRS debts, you can set up a payment plan online on IRS.gov or with Form 9465.'],
    },
    {
      id: 'debt-validation', type: 'reminder', local: 'Debt validation notice', name: 'Letter from a debt collector', about: 'A debt collector says you owe money. You can dispute the debt in writing by the date in the notice — you get at least 30 days.', urgency: 'high', extendable: false, patterns: [/validation notice/i, /attempt to collect a debt/i, /from a debt collector/i, /dispute (?:all or part of )?(?:the|this) debt/i, /verification of (?:the|this) debt/i, /original creditor/i, /itemization date/i],
      steps: ['Check if you know this debt. If you don’t, or the amount looks wrong, dispute it in writing by the date in the notice. They must then stop collecting until they send you proof. There is a ready-made letter below.', 'Don’t pay until you are sure the debt is yours and the collector is real. Never pay with gift cards.'],
    },
    {
      id: 'proposed-changes', type: 'tax-assessment', local: 'Proposed changes to your tax return (CP2000)', name: 'Proposed tax change', about: 'Your tax return doesn’t match what employers, banks or others reported. They propose a change to your tax. Respond by the date in the notice.', urgency: 'high', patterns: [/\bCP2000\b/, /proposed (?:changes?|adjustments?|amount|assessment|tax)/i, /underreport/i, /(?:doesn[’']t|does not) match/i, /information (?:reported|received) (?:to us )?(?:by|from)/i],
      steps: ['Compare the income in the notice with your own papers (W-2, 1099). If you agree, sign the response form and pay, or ask for a payment plan. If you don’t agree, send the response form with your explanation and proof by the date in the notice.', 'If you don’t answer, the IRS usually sends a Notice of Deficiency and then charges the tax.'],
    },
    {
      id: 'refund-change', type: 'decision', local: 'Change to your return or refund (CP11, CP12, CP49)', name: 'Changed tax return or refund', about: 'They corrected your tax return, or used your refund to pay a debt. Your refund or the tax you owe is different from what you expected.', urgency: 'medium', patterns: [/\bCP(?:11|12|24|49)\b/, /we (?:changed|corrected)\b/i, /changes? to your (?:\d{4} )?(?:tax )?return/i, /refund (?:offset|was applied|has been applied)/i, /your refund (?:is|was|has been) (?:different|changed|reduced|applied)/i, /\bmath error/i, /applied (?:all or part of )?your (?:overpayment|refund)/i],
      steps: ['Compare the changes with your return. If you don’t agree, contact them by the date in the notice — for IRS math-error notices you usually have 60 days.'],
    },
    {
      id: 'overpayment', type: 'repayment', local: 'Notice of overpayment', name: 'Request to pay money back', about: 'They say they paid you too much, for example Social Security or unemployment benefits, and want the money back.', urgency: 'high', patterns: [/\boverpa(?:id|yment)/i, /paid you .{0,30}too much/i, /must (?:repay|pay back)/i, /recover(?:y of)? (?:the|this) overpayment/i],
      steps: ['If you think it’s wrong, appeal (ask for reconsideration) before the deadline — for Social Security, within 60 days.', 'If it wasn’t your fault and you can’t afford to pay it back, ask for a waiver. For Social Security use form SSA-632. You can ask for a waiver at any time.', 'If you ask within 30 days, Social Security usually waits to collect until it decides.'],
    },
    {
      id: 'rfe', type: 'documents', local: 'Request for Evidence (RFE) / Notice of Intent to Deny (NOID)', name: 'Request for more proof', about: 'USCIS needs more proof before it decides your case. A Notice of Intent to Deny means they plan to say no unless your answer changes their mind.', urgency: 'high', extendable: false, patterns: [/request for evidence/i, /\bRFE\b/, /notice of intent to (?:deny|revoke|terminate)/i, /\bNOID\b/, /submit (?:the )?(?:following |requested |additional )?evidence/i],
      steps: ['Send everything they ask for in one package, with a copy of the notice on top, before the date in the notice. USCIS doesn’t give extra time.', 'If you are unsure what to send, get help from an immigration lawyer or a DOJ-accredited representative.'],
    },
    { id: 'documents', type: 'documents', local: 'Request for information', name: 'Request for documents', about: 'They need papers or answers from you before they can decide, or to keep your benefits or coverage going.', urgency: 'medium', patterns: [/request for (?:information|verification|additional information)/i, /we need (?:more |additional |some )?(?:information|documents|proof)/i, /please (?:send|provide|submit|return) (?:us )?(?:the following|copies|a copy|proof)/i, /missing (?:information|documents)/i, /verification (?:form|request|of (?:income|identity))/i, /verify your identity/i, /\brenewal (?:form|packet)/i, /renew your (?:coverage|benefits)/i] },
    {
      id: 'denial', type: 'rejection', local: 'Denial notice', name: 'Denial', about: 'Your application or claim was turned down. You can usually appeal — the letter says how and by when.', urgency: 'medium', patterns: [/\bdenial\b/i, /\b(?:is|was|has been|have been) denied\b/i, /we (?:have )?denied/i, /(?:unable|not able) to approve/i, /\bnot eligible\b/i, /\bineligible\b/i],
      steps: ['Look for the part about your appeal rights. It says if you can appeal, where, and by when. Deadlines differ a lot — from about 10 days to a few months.', 'For an immigration denial, get help from an immigration lawyer or a DOJ-accredited representative quickly.'],
    },
    { id: 'approval', type: 'approval', local: 'Approval notice', name: 'Approval', about: 'Your application was approved. Check that names, dates and amounts are right.', urgency: 'low', patterns: [/approval notice/i, /\b(?:is|was|has been|have been) approved\b/i, /we (?:have )?approved/i, /notice of award/i, /congratulations/i] },
    {
      id: 'appointment', type: 'appointment', local: 'Appointment / interview notice', name: 'Appointment', about: 'They want you to come to an appointment, for example for biometrics or an interview. Missing it can delay or end your case or your benefits.', urgency: 'medium', patterns: [/\bappointment\b/i, /biometric/i, /application support center/i, /\bASC\b/, /\binterview\b/i, /please (?:appear|come|go) to/i, /you (?:are|have been) scheduled\b/i],
      steps: ['For a USCIS appointment, reschedule only before the appointment, in your USCIS online account or through the USCIS Contact Center. If you miss it without rescheduling, your case can be denied.'],
    },
    {
      id: 'jury', type: 'appointment', local: 'Jury summons', name: 'Jury duty', about: 'You were picked at random as a possible juror. You must answer the summons, even if you can’t serve.', urgency: 'medium', objection: false, extendable: false, instalments: false, patterns: [/\bjury\b/i, /\bjurors?\b/i, /jury (?:summons|service|duty)/i, /qualification questionnaire/i],
      steps: ['Answer the summons or questionnaire by the date given, often online. Ignoring it can lead to a fine.', 'Only US citizens can serve on a jury. If you are not a citizen, say so in your answer — don’t ignore the summons. There is a ready-made letter below.'],
    },
    {
      id: 'ticket', type: 'fine', local: 'Parking or traffic ticket (citation)', name: 'Ticket', about: 'A fine for breaking a parking or traffic rule. Pay it or contest it by the date on the ticket — if you do nothing, it usually costs more.', urgency: 'high', patterns: [/parking (?:ticket|citation|violation)/i, /traffic (?:ticket|citation|violation)/i, /notice of (?:parking )?violation/i, /\bcitation\b/i, /red light|speed(?:ing)? camera|automated (?:speed|traffic) enforcement/i, /fine amount|amount of (?:the )?fine/i],
      steps: ['To contest, follow the steps on the ticket — usually you ask for a hearing online or by mail. Paying usually means you accept it.', 'For traffic tickets, unpaid fines or missed court dates can lead to a suspended license.'],
    },
    {
      id: 'eviction', type: 'termination', local: 'Eviction notice / notice to pay rent or quit', name: 'Eviction notice', about: 'Your landlord wants you to pay or move out. Notice periods are set by state law — for unpaid rent often only 3 to 14 days.', urgency: 'high', objection: false, patterns: [/\bevict/i, /pay rent or quit/i, /notice to (?:quit|vacate)/i, /\b(?:3|three|5|five|7|seven|10|ten|14|fourteen|30|thirty|60|sixty)[- ]day notice/i, /terminat(?:e|ion of) (?:your |the )?(?:tenancy|lease|rental agreement)/i, /surrender (?:possession|the premises)/i],
      steps: ['Don’t ignore it, but don’t panic: usually only a court can order you to leave. In most states, a landlord can’t change the locks or remove your things without a court order.', 'Get free legal help today, for example from legal aid or a tenant union. Deadlines are very short, and you may have defenses or rent help options.'],
    },
    { id: 'bill', type: 'bill', local: 'Bill / statement', name: 'Bill', about: 'A bill or account statement. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/(?<!not a )\bbill\b/i, /\bstatement\b/i, /\binvoice\b/i, /total amount due/i, /\bdue date\b/i, /new charges/i, /minimum payment/i, /monthly payment/i] },
  ],
  references: [
    { name: 'Receipt number', local: 'Receipt Number', pattern: /\breceipt (?:number|no\.?|#)/gi },
    { name: 'A-Number', local: 'A-Number', pattern: /(?:\bA-Number|\bA#|alien (?:registration )?number)/gi },
    { name: 'Case number', local: 'Case number', pattern: /(?:\bcase (?:number|no\.?|#)|\bdocket (?:number|no\.?|#)|\bindex (?:number|no\.?|#))/gi },
    { name: 'Notice number', local: 'Notice', pattern: /\bnotice(?: number| no\.?)?(?=\s*:)/gi },
    { name: 'Tax year', local: 'Tax year', pattern: /\btax (?:year|period)(?=\s*:)/gi },
    { name: 'Account number', local: 'Account number', pattern: /(?:\baccount (?:number|no\.?|#)|\bacct\.? (?:no\.?|#))/gi },
    { name: 'Ticket number', local: 'Citation number', pattern: /\b(?:citation|ticket|violation) (?:number|no\.?|#)/gi },
    { name: 'Claim number', local: 'Claim number', pattern: /\bclaim (?:number|no\.?|#|id)/gi },
    { name: 'Invoice number', local: 'Invoice number', pattern: /\b(?:invoice|statement) (?:number|no\.?|#)/gi },
    { name: 'Member ID', local: 'Member ID', pattern: /\b(?:member|subscriber|policy) (?:id|number|no\.?|#)/gi },
    { name: 'Juror number', local: 'Juror number', pattern: /\b(?:juror|participant) (?:number|no\.?|#|id)/gi },
    { name: 'Social Security number', local: 'Social Security number', personal: true, pattern: /(?:\bsocial security (?:number|no\.?)|\bSSN\b|\btaxpayer identification number|\bITIN\b)/gi },
  ],
  glossary: [
    { term: 'notice', slug: 'notice', pattern: /\bnotice\b/i, meaning: 'An official letter. The date printed on it often starts the deadline.' },
    { term: 'balance due', slug: 'balance-due', pattern: /balance due/i, meaning: 'The amount you still owe.' },
    { term: 'penalty', slug: 'penalty', pattern: /\bpenalt(?:y|ies)\b/i, meaning: 'Extra charge for paying or filing late, or for a mistake.', tip: 'You can ask the IRS to remove a penalty if you had a good reason, or often if you had no penalties in the 3 years before (first-time abatement).' },
    { term: 'interest', slug: 'interest', pattern: /\binterest\b/i, meaning: 'Extra money charged on an unpaid amount, usually every day until you pay.' },
    { term: 'installment agreement', slug: 'installment-agreement', pattern: /installment (?:agreement|plan)|payment (?:plan|arrangement)/i, meaning: 'A deal to pay a debt in monthly parts. Also called a payment plan.', tip: 'For IRS debts you can often set one up online on IRS.gov. Fees are lower if you apply online and pay by direct debit.' },
    { term: 'levy', slug: 'levy', pattern: /\blev(?:y|ies|ied)\b/i, meaning: 'Taking money or property by force to pay a debt, for example from your bank account or wages.' },
    { term: 'lien', slug: 'lien', pattern: /\bliens?\b/i, meaning: 'A legal claim on your property, like a house or car, until a debt is paid.' },
    { term: 'garnishment', slug: 'garnishment', pattern: /garnish/i, meaning: 'Money taken straight from your pay or bank account to pay a debt. Private creditors usually need a court judgment first.' },
    { term: 'Collection Due Process', slug: 'collection-due-process', pattern: /collection due process|\bCDP\b/i, meaning: 'Your right to a hearing with the IRS Independent Office of Appeals about a levy or lien.', tip: 'Ask with Form 12153 within 30 days of the date on the IRS final notice. If you ask later (within 1 year), you can only get an “equivalent hearing”, without the right to go to Tax Court afterwards.' },
    { term: 'Notice of Deficiency', slug: 'notice-of-deficiency', pattern: /notice of deficiency|letter 3219/i, meaning: 'IRS letter that says you owe more tax. It gives you the right to challenge it in Tax Court.', tip: 'You have 90 days from the date of the notice to file a petition with the Tax Court (150 days if it is addressed to you outside the US). This deadline can’t be extended.' },
    { term: 'Taxpayer Advocate Service', slug: 'taxpayer-advocate-service', pattern: /taxpayer advocate/i, meaning: 'An independent office inside the IRS. It helps for free when a tax problem causes you hardship or isn’t solved the normal way.' },
    { term: 'audit', slug: 'audit', pattern: /\baudit/i, meaning: 'A check of your tax return. They may ask for receipts and other proof.' },
    { term: 'adjustment', slug: 'adjustment', pattern: /\badjust(?:ment|ed)\b/i, meaning: 'A change to your account, for example to your tax, refund or benefit amount.' },
    { term: 'refund offset', slug: 'refund-offset', pattern: /\boffset\b/i, meaning: 'Your refund was used to pay a debt you owe, for example back taxes, child support or a student loan.' },
    { term: 'SSN', slug: 'ssn', pattern: /\bSSN\b|social security number/i, meaning: 'Social Security number. Your 9-digit number for work, taxes and benefits.', tip: 'Give it only when you must. Real letters usually show only the last 4 digits.' },
    { term: 'ITIN', slug: 'itin', pattern: /\bITIN\b|individual taxpayer identification number/i, meaning: 'Individual Taxpayer Identification Number. A tax number from the IRS for people who can’t get an SSN.' },
    { term: 'EIN', slug: 'ein', pattern: /\bEIN\b|employer identification number/i, meaning: 'Employer Identification Number. A tax number for businesses and employers.' },
    { term: 'A-Number', slug: 'a-number', pattern: /\bA-Number\b|alien (?:registration )?number/i, meaning: 'Your immigration file number (Alien Registration Number). It starts with A, followed by up to 9 digits.' },
    { term: 'receipt notice', slug: 'receipt-notice', pattern: /receipt notice|\bI-797C\b/i, meaning: 'A letter (Form I-797C) that confirms USCIS got your application. It shows your receipt number.' },
    { term: 'RFE', slug: 'rfe', pattern: /request for evidence|\bRFE\b/i, meaning: 'Request for Evidence. USCIS needs more proof before it decides your case.', tip: 'Answer by the date in the notice and put a copy of the notice on top. USCIS doesn’t give extra time.' },
    { term: 'NOID', slug: 'noid', pattern: /notice of intent to deny|\bNOID\b/i, meaning: 'Notice of Intent to Deny. USCIS plans to say no unless your answer changes their mind.' },
    { term: 'biometrics', slug: 'biometrics', pattern: /biometric/i, meaning: 'Your fingerprints, photo and signature, taken at an appointment.' },
    { term: 'green card', slug: 'green-card', pattern: /green card|permanent resident card|lawful permanent resident/i, meaning: 'Permanent resident card. Proof that you can live and work in the US permanently.' },
    { term: 'work permit (EAD)', slug: 'work-permit-ead', pattern: /employment authorization|\bEAD\b|work permit/i, meaning: 'Employment Authorization Document. A card that shows you may work in the US for a set time.' },
    { term: 'overpayment', slug: 'overpayment', pattern: /\boverpa(?:id|yment)/i, meaning: 'Money paid to you by mistake that they want back. In IRS letters, it can also mean you paid too much tax.', tip: 'If it’s wrong, ask for reconsideration. If it wasn’t your fault and you can’t pay it back, ask for a waiver.' },
    { term: 'waiver', slug: 'waiver', pattern: /\bwaiver\b/i, meaning: 'A request to cancel a debt or set aside a rule in your case, for example an overpayment you can’t pay back.' },
    { term: 'reconsideration', slug: 'reconsideration', pattern: /reconsideration/i, meaning: 'A new review of a decision by the same office. Often the first step of an appeal.' },
    { term: 'appeal', slug: 'appeal', pattern: /\bappeal/i, meaning: 'A formal request to change a decision. It must reach them by the deadline.', tip: 'Use their form or website if they have one. Keep proof of when you sent it, for example a certified mail receipt.' },
    { term: 'hearing', slug: 'hearing', pattern: /\bhearing\b/i, meaning: 'A meeting, in person, by phone or by video, where a judge or officer listens to both sides.' },
    { term: 'fair hearing', slug: 'fair-hearing', pattern: /fair hearing/i, meaning: 'A hearing to appeal a decision about benefits like Medicaid or SNAP.' },
    { term: 'jury duty', slug: 'jury-duty', pattern: /\bjury\b|\bjurors?\b/i, meaning: 'Serving as a juror in a court case. Courts pick people at random, often from lists of drivers and voters.', tip: 'Only US citizens can serve. If you are not a citizen, answer the summons and say so — don’t ignore it.' },
    { term: 'summons', slug: 'summons', pattern: /\bsummons\b/i, meaning: 'An official paper that orders you to answer a lawsuit or come to court.', tip: 'Don’t ignore it. Write down the deadline to answer and get legal help the same day.' },
    { term: 'complaint', slug: 'complaint', pattern: /\bcomplaint\b/i, meaning: 'In court papers: the document that starts a lawsuit and says what the other side wants.' },
    { term: 'default judgment', slug: 'default-judgment', pattern: /default judgment|judgment by default/i, meaning: 'A court decision against you because you didn’t answer or didn’t come to court.' },
    { term: 'small claims', slug: 'small-claims', pattern: /small claims/i, meaning: 'A simple court for smaller money disputes. People often go without a lawyer.' },
    { term: 'debt validation', slug: 'debt-validation', pattern: /validation notice|debt validation|verification of (?:the |this )?debt/i, meaning: 'Information a debt collector must give you about a debt, and your right to dispute it.', tip: 'Dispute in writing by the date in the notice. The collector must then stop collecting until it sends you proof.' },
    { term: 'statute of limitations', slug: 'statute-of-limitations', pattern: /statute of limitations|time-barred/i, meaning: 'The time limit for suing over a debt. It differs by state and by type of debt.' },
    { term: 'eviction', slug: 'eviction', pattern: /\bevict/i, meaning: 'The legal process a landlord must use to make a tenant leave.', tip: 'Usually only a court can order you out. Get legal help right away — the deadlines are very short.' },
    { term: 'security deposit', slug: 'security-deposit', pattern: /security deposit/i, meaning: 'Money you paid when you moved in. The landlord must return it, minus allowed costs, within a time set by state law.' },
    { term: 'lease', slug: 'lease', pattern: /\blease\b/i, meaning: 'Your rental contract.' },
    { term: 'utility shutoff', slug: 'utility-shutoff', pattern: /shut-?off|disconnection/i, meaning: 'When a utility company cuts your power, gas or water for unpaid bills.' },
    { term: 'EOB', slug: 'eob', pattern: /explanation of benefits|\bEOB\b/i, meaning: 'Explanation of Benefits. A statement from your health insurer about what it paid. It is not a bill.' },
    { term: 'deductible', slug: 'deductible', pattern: /\bdeductible\b/i, meaning: 'In health insurance: what you pay each year before the insurer starts to pay. In tax letters: an amount you can subtract from your income.' },
    { term: 'premium', slug: 'premium', pattern: /\bpremiums?\b/i, meaning: 'Your regular payment for insurance, usually every month.' },
    { term: 'Medicaid', slug: 'medicaid', pattern: /\bmedicaid\b/i, meaning: 'Free or low-cost health coverage from your state for people with low income.' },
    { term: 'SNAP', slug: 'snap', pattern: /\bSNAP\b|[Ff]ood [Ss]tamps/, meaning: 'Supplemental Nutrition Assistance Program. Monthly money for food on an EBT card.' },
    { term: 'unemployment benefits', slug: 'unemployment-benefits', pattern: /unemployment (?:insurance|benefits?|compensation)/i, meaning: 'Payments from your state for a while after you lose a job through no fault of your own.' },
    { term: 'citation', slug: 'citation', pattern: /\bcitation\b/i, meaning: 'A ticket. An official notice that you broke a rule, for example a parking or traffic rule.' },
    { term: 'certified mail', slug: 'certified-mail', pattern: /certified mail/i, meaning: 'Mail with proof that you sent it and that it was delivered. Good for important replies.' },
  ],
  replies: {
    objection: {
      subject: (term, of) => `Re: ${capitalize(term)} — your notice ${of}`,
      body: (term, of) => [
        `I do not agree with your notice ${of}. Please accept this letter as my ${term}.`,
        '',
        'Reason: [Explain in a few sentences why you disagree. Attach copies of any proof.]',
        '',
        'Please review my case and confirm in writing that you received this letter.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'debt-validation',
      title: 'Dispute the debt and ask for proof (debt validation)',
      advice: 'Use this if you don’t recognize the debt or the amount looks wrong. Send it by the date in the notice, by certified mail, and keep a copy. The collector must stop collecting until it sends you proof.',
      english: 'I dispute this debt. Please send me proof: the original creditor, the amount and how you worked it out, and your right to collect it. Please stop collecting until you send it.',
      subject: 'Re: Dispute of debt and request for validation',
      body: (result) => [
        `I received your letter ${letterOf(result)} about a debt of ${amountOf(result)}.`,
        '',
        'I dispute this debt. Please send me verification of the debt, including:',
        '- the name and address of the original creditor,',
        '- the amount you say I owe and how you calculated it,',
        '- proof that you have the right to collect it.',
        '',
        'Please stop collecting this debt until you send me this information.',
        '',
        'This letter is not an admission that I owe this debt.',
      ],
      when: (result) => result.sender?.id === 'debt-collector' || result.kind?.id === 'debt-validation',
      replaces: 'objection',
    },
    {
      id: 'penalty-relief',
      title: 'Ask to remove the penalty (penalty relief)',
      advice: 'Use this if you had a good reason for paying or filing late, for example a serious illness or a disaster, or if you had no penalties in the 3 years before. You can also ask by phone. Interest on the tax itself usually stays.',
      english: 'Please remove the penalty on my account. Reason: [your reason, or: I had no penalties in the 3 years before]. I attach proof.',
      subject: 'Re: Request for penalty relief',
      body: (result) => [
        `About your notice ${letterOf(result)}: I ask you to remove the penalty charged on my account.`,
        '',
        'Reason: [Explain why you paid or filed late, for example a serious illness or a disaster. Or write: I had no penalties in the 3 tax years before, and I ask for first-time abatement.]',
        '',
        '[I have attached copies of my proof.]',
        '',
        'Thank you for reviewing my request.',
      ],
      when: (result) => result.sender?.id === 'irs' && /\bpenalt(?:y|ies)\b/i.test(result.text ?? ''),
    },
    {
      id: 'jury-not-citizen',
      title: 'Tell the court you can’t serve (not a US citizen)',
      advice: 'Use this only if it is true. Many courts want the answer on their own questionnaire or website — check the summons first. Answer by the date on the summons.',
      english: 'I received your jury summons. I am not a US citizen, so I can’t serve on a jury. Please remove me from the jury list and confirm that I don’t have to come.',
      subject: 'Re: Jury summons — not qualified to serve',
      body: (result) => [
        `I received your jury summons ${letterOf(result)}.`,
        '',
        'I am not a citizen of the United States, so I am not qualified to serve on a jury. [I am a permanent resident / I am in the US on a visa.]',
        '',
        'Please remove me from the jury list and confirm in writing that I do not have to appear.',
      ],
      when: (result) => result.kind?.id === 'jury',
    },
  ],
  samples: [
    {
      id: 'irs',
      title: 'IRS',
      subtitle: 'Tax bill (CP14) with a payment date',
      build(today) {
        const letter = addDays(today, -3);
        const due = nextWorkday(addDays(letter, 21));
        const year = Number(today.slice(0, 4)) - 1;
        return `Department of the Treasury
Internal Revenue Service
Kansas City, MO 64999-0025

Notice: CP14
Tax year: ${year}
Notice date: ${longDate(letter)}
Social Security number: XXX-XX-1234
To contact us: 1-800-555-0100
Page 1 of 3

Jordan Example
1234 Sample St Apt 5
Springfield, IL 62704

Balance due: $1,234.56

You have unpaid taxes for ${year}

Our records show that you have unpaid taxes for the ${year} tax year.

Billing summary
Unpaid tax: $1,150.00
Failure-to-pay penalty: $46.00
Interest charged: $38.56
Amount due by ${longDate(due)}: $1,234.56

What you need to do immediately

Pay the amount due of $1,234.56 by ${longDate(due)}, to avoid more penalty and interest charges. You can pay online at www.irs.gov/payments, or send a check or money order payable to “United States Treasury”.

If you can’t pay the full amount, pay what you can now. You may be able to set up a payment plan (installment agreement) online at www.irs.gov/payments.

If you want to dispute the amount due, call us at the number above or write to us within 30 days from the date of this notice. We will review your account and contact you.

If you don’t pay the amount due by ${longDate(due)}, interest will increase and more penalties may apply.

Internal Revenue Service`;
      },
    },
    {
      id: 'uscis',
      title: 'USCIS',
      subtitle: 'Biometrics appointment',
      build(today) {
        const letter = addDays(today, -4);
        const received = addDays(today, -70);
        const appointment = nextWorkday(addDays(today, 8));
        return `Department of Homeland Security
U.S. Citizenship and Immigration Services

Form I-797C, Notice of Action
THIS NOTICE DOES NOT GRANT ANY IMMIGRATION STATUS OR BENEFIT.

Notice type: ASC Appointment Notice
Notice date: ${usDate(letter)}
Receipt Number: IOE0912345678
Case type: I-485, Application to Register Permanent Residence or Adjust Status
Received date: ${usDate(received)}
A-Number: A123456789

Priya Example
45 Sample Ave Apt 2
Houston, TX 77002

To process your application, USCIS must take your biometrics (fingerprints, photo and signature). Please go to the Application Support Center (ASC) below.

Application Support Center:
USCIS Houston
1234 Example Blvd, Suite 100
Houston, TX 77036

Date and time of appointment:
${longDate(appointment)}
9:30 a.m.

When you go to the ASC, you must bring:
1. this appointment notice, and
2. your photo ID, for example a passport, a driver’s license or a state ID card.

If you don’t bring this notice and a photo ID, we may not take your biometrics.

If you need to reschedule, do it before your appointment in your USCIS online account at my.uscis.gov, or call the USCIS Contact Center at 1-800-555-0199. You must have a good reason.

If you don’t come to your appointment and don’t reschedule it, USCIS may consider your application abandoned.`;
      },
    },
  ],
};
