import { addDays, addMonths, formatLocalDate, fromIso } from '../dates.js';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function monthYear(iso) {
  const [year, month] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

const swissDate = (iso) => formatLocalDate(iso, '.');

export default {
  id: 'ch',
  slug: 'switzerland',
  name: 'Switzerland',
  adjective: 'Swiss',
  flag: '🇨🇭',
  language: 'de',
  currency: 'CHF',
  decimal: '.',
  thousands: "'’ ",
  dateSeparator: '.',
  ibanLength: 21,
  intro: 'Swiss offices often send letters by registered post (Einschreiben), and some deadlines are only 10 days. Briefly covers German-language letters — rules can differ a little from canton to canton.',
  signals: [
    /\bschweiz/i,
    /eidgen(?:ossenschaft|össisch)/i,
    /\.admin\.ch\b/i,
    /\.ch\b/i,
    /\bCH\d{2}\s?\d{4}/,
    /\b(?:CHF|SFr\.?|Fr\.)\s?\d|\d\s?CHF\b/,
    /\bkanton/i,
    /betreibungsamt|zahlungsbefehl|rechtsvorschlag/i,
    /einwohnerkontrolle|einwohneramt/i,
    /\bserafe\b/i,
    /\bAHV\b/,
    /\bRAV\b/,
    /\binnert\b/i,
    /\bCH-\d{4}\b/,
    /grüezi|freundliche grüsse/i,
  ],
  deliveryDays: 3,
  deadlineWords: ['Frist', 'bis zum', 'innert'],
  deliveryNote: 'In Switzerland, a legal deadline starts the day after you receive the letter. A registered letter you don’t collect usually counts as delivered on the 7th day after the collection notice (Abholungseinladung).',
  objectionAdvice: 'Use this if you think the decision is wrong. Send it signed before the deadline, with your reasons and what you want changed.',
  objection: [
    { word: 'Einsprache', pattern: /einsprache/i },
    { word: 'Rechtsvorschlag', pattern: /rechtsvorschlag/i },
    { word: 'Rekurs', pattern: /\brekurs/i },
    { word: 'Beschwerde', pattern: /beschwerde/i },
  ],
  help: {
    debt: 'a debt advice centre (Schuldenberatung) in your canton, for example through Schuldenberatung Schweiz (schulden.ch) or Caritas',
    tenant: 'the tenants’ association (Mieterinnen- und Mieterverband)',
    instalments: 'Ratenzahlung',
    general: 'a free advice centre, for example the integration office of your canton or town (Fachstelle Integration) or Caritas',
  },
  senders: [
    {
      id: 'steueramt',
      slug: 'steueramt',
      name: 'Cantonal tax office',
      local: 'Kantonales Steueramt / Steuerverwaltung',
      about: 'Works out your income and wealth tax. In Switzerland you pay tax to the federal state, your canton and your town.',
      patterns: [/kantonales steueramt/i, /steuerverwaltung/i, /\bsteueramt\b/i, /veranlagungsverfügung/i, /einschätzungsentscheid/i, /direkte bundessteuer/i, /staats- und gemeindesteuer/i, /quellensteuer/i],
      letters: ['Steuererklärung — the form for your yearly tax return', 'Veranlagungsverfügung — the result of your tax return', 'Provisorische Rechnung — an advance tax bill based on an estimate', 'Mahnung — you missed a payment or the tax return deadline'],
      tips: ['If you disagree with your tax assessment, send an Einsprache, usually within 30 days.', 'If you can’t send your tax return in time, ask for more time (Fristerstreckung) before the deadline. This is often possible online.'],
    },
    {
      id: 'gemeindesteueramt',
      slug: 'gemeindesteueramt',
      name: 'Town tax office',
      local: 'Gemeindesteueramt',
      about: 'The tax office of your town. In some cantons it sends you the tax return form and your tax bills.',
      patterns: [/gemeindesteueramt/i, /steueramt der (?:stadt|gemeinde)/i, /steuerbezug/i, /gemeindesteuern/i],
      letters: ['Steuererklärung — the tax return form', 'Steuerrechnung — your tax bill', 'Zahlungserinnerung — a reminder to pay'],
      tips: ['Many towns let you pay your tax in parts during the year. This avoids one big bill later.', 'Late payments cost interest (Verzugszins).'],
    },
    {
      id: 'rav',
      slug: 'rav',
      name: 'Regional employment centre',
      local: 'RAV (Regionales Arbeitsvermittlungszentrum)',
      about: 'Helps you find a job when you are unemployed. You must go to its appointments and show that you are looking for work.',
      patterns: [/\bRAV\b/, /regionales arbeitsvermittlungszentrum/i, /arbeitsvermittlung/i, /arbeitsbemühungen/i, /arbeitsbemuehungen/i, /stellensuchend/i, /beratungsgespräch/i],
      letters: ['Einladung zum Beratungsgespräch — an appointment with your adviser', 'Nachweis der persönlichen Arbeitsbemühungen — the form where you list your job applications', 'Verfügung über Einstelltage — your benefits stop for some days as a penalty'],
      tips: ['Hand in your list of job applications by the 5th of the next month.', 'Register as soon as you know you will lose your job. You get no money for days before you registered.'],
    },
    {
      id: 'arbeitslosenkasse',
      slug: 'arbeitslosenkasse',
      name: 'Unemployment fund',
      local: 'Arbeitslosenkasse',
      about: 'Pays your unemployment money (Taggeld). You choose a fund when you register as unemployed.',
      patterns: [/arbeitslosenkasse/i, /arbeitslosenentschädigung/i, /arbeitslosenversicherung/i, /\bALV\b/, /\btaggeld/i, /angaben der versicherten person/i],
      letters: ['Abrechnung — how much they pay you this month', 'Angaben der versicherten Person — the form you send every month', 'Verfügung — a decision about your claim'],
      tips: ['Send the monthly form on time. Without it, they can’t pay you.'],
    },
    {
      id: 'migrationsamt',
      slug: 'migrationsamt',
      name: 'Migration office',
      local: 'Migrationsamt',
      about: 'The office of your canton that handles residence permits for foreigners.',
      patterns: [/migrationsamt/i, /amt für migration/i, /migrationsdienst/i, /staatssekretariat für migration/i, /\bSEM\b/, /aufenthaltsbewilligung/i, /niederlassungsbewilligung/i, /kurzaufenthaltsbewilligung/i, /ausländerausweis/i],
      letters: ['Verlängerung der Aufenthaltsbewilligung — a form to renew your permit', 'Rechtliches Gehör — they plan a decision about your stay and let you explain first', 'Verfügung — a decision about your permit'],
      tips: ['Your permit card shows an end date. Ask for a renewal before that date — many cantons send you a form for it.', 'Answer letters about rechtliches Gehör in time. What you write can change the decision.'],
    },
    {
      id: 'einwohnerkontrolle',
      slug: 'einwohnerkontrolle',
      name: 'Residents’ registration office',
      local: 'Einwohnerkontrolle / Einwohneramt',
      about: 'Keeps the list of everyone who lives in the town. You register here when you move in or out.',
      patterns: [/einwohnerkontrolle/i, /einwohneramt/i, /einwohnerdienste/i, /personenmeldeamt/i, /wohnsitzbestätigung/i, /niederlassungsausweis/i],
      letters: ['Anmeldebestätigung — proof that you registered', 'Aufforderung zur Anmeldung — you must register your address', 'Wohnsitzbestätigung — proof of where you live'],
      tips: ['Register within 14 days after you move in, and tell them when you move out.'],
    },
    {
      id: 'krankenkasse',
      slug: 'krankenkasse',
      name: 'Health insurance',
      local: 'Krankenkasse',
      about: 'Your health insurance company. Basic health insurance is required by law for everyone who lives in Switzerland.',
      patterns: [/krankenkasse/i, /krankenversicherung/i, /grundversicherung/i, /krankenpflegeversicherung/i, /\bKVG\b/, /\bprämie/i, /\bCSS\b/, /helsana/i, /swica/i, /sanitas/i, /visana/i, /concordia/i, /groupe mutuel/i, /assura/i, /\bKPT\b/, /ÖKK/, /atupri/i, /sympany/i],
      letters: ['Prämienrechnung — your monthly premium bill', 'Mahnung — you missed a premium payment', 'Leistungsabrechnung — what they paid for your doctor and what you pay yourself', 'Versicherungspolice — your policy for next year, with the new premium'],
      tips: ['You must take basic insurance within 3 months after you arrive in Switzerland.', 'To change your basic insurance for next year, your notice must reach them by 30 November. You can’t change while you still owe them premiums.'],
    },
    {
      id: 'serafe',
      slug: 'serafe',
      name: 'Radio and TV fee office',
      local: 'Serafe AG',
      about: 'Collects the radio and TV fee. Every household in Switzerland pays it, even without a TV or radio.',
      patterns: [/serafe/i, /haushaltabgabe/i, /radio- und fernsehabgabe/i, /abgabe für radio und fernsehen/i],
      letters: ['Rechnung — the fee bill for your household', 'Zahlungserinnerung or Mahnung — you haven’t paid yet'],
      tips: ['There is one bill per household. If you get two bills for the same flat, tell Serafe.', 'People who get supplementary benefits (Ergänzungsleistungen) can ask not to pay the fee.'],
    },
    {
      id: 'betreibungsamt',
      slug: 'betreibungsamt',
      name: 'Debt collection office',
      local: 'Betreibungsamt',
      about: 'A state office that collects debts for creditors. If you don’t react, it can seize part of your wages or things.',
      patterns: [/betreibungsamt/i, /betreibungs- und konkursamt/i, /zahlungsbefehl/i, /\bbetreibung\b/i, /betreibungsnummer/i, /\bSchKG\b/],
      letters: ['Zahlungsbefehl — someone says you owe money; you have 10 days to object', 'Pfändungsankündigung — they will seize wages or things on a set date', 'Pfändungsurkunde — the list of what was seized', 'Verlustschein — proof that a debt could not be paid'],
      tips: ['Anyone can start a Betreibung, even without proof. If you don’t owe the money, file a Rechtsvorschlag within 10 days.', 'If you filed a Rechtsvorschlag and the creditor does nothing, you can ask after 3 months that the Betreibung is no longer shown to others.'],
    },
    {
      id: 'bussen',
      slug: 'polizei-statthalteramt',
      name: 'Police and fines office',
      local: 'Polizei / Statthalteramt / Stadtrichteramt',
      about: 'Handles fines, for example for speeding or wrong parking, and smaller offences.',
      patterns: [/kantonspolizei/i, /stadtpolizei/i, /\bpolizei/i, /statthalteramt/i, /stadtrichteramt/i, /polizeirichteramt/i, /staatsanwaltschaft/i, /ordnungsbusse/i, /strafbefehl/i],
      letters: ['Ordnungsbusse — a fixed fine for a small offence', 'Strafbefehl — a penalty order; object within 10 days if you disagree', 'Vorladung — you must come for questioning'],
      tips: ['Pay an Ordnungsbusse within the period on the slip, usually 30 days. If you don’t, a normal procedure starts and it costs more.', 'Object to a Strafbefehl in writing within 10 days. Otherwise it becomes final, like a court judgment.'],
    },
    {
      id: 'ahv',
      slug: 'ahv-ausgleichskasse',
      name: 'Social insurance office (AHV)',
      local: 'AHV-Ausgleichskasse / SVA',
      about: 'Runs the state pension (AHV) and disability insurance (IV). It also collects contributions, for example from self-employed people and people who don’t work.',
      patterns: [/ausgleichskasse/i, /\bSVA\b/, /sozialversicherungsanstalt/i, /\bAHV\b/, /ahv\/iv\/eo/i, /nichterwerbstätig/i, /ergänzungsleistungen/i],
      letters: ['Beitragsverfügung — how much you must pay in contributions', 'Akontorechnung — an advance bill for contributions', 'Ergänzungsleistungen — extra money if your pension is not enough to live on'],
      tips: ['If you live in Switzerland and don’t work, you may still have to pay AHV contributions. Ask your Ausgleichskasse.', 'Your AHV number starts with 756. It is your social security number — keep it safe.'],
    },
    {
      id: 'sozialamt',
      slug: 'sozialamt',
      name: 'Social services',
      local: 'Sozialamt / Sozialdienst',
      about: 'Gives social help (Sozialhilfe) to people who can’t pay for their basic living costs.',
      patterns: [/sozialamt/i, /sozialdienst/i, /soziale dienste/i, /sozialhilfe/i, /sozialbehörde/i, /wirtschaftliche hilfe/i, /sozialzentrum/i],
      letters: ['Unterstützungsbudget — how much help you get', 'Aufforderung zur Mitwirkung — they need documents from you', 'Rückerstattung — in some cases they ask you to pay help back'],
      tips: ['Tell them right away about any change in your income, rent or household.', 'Social help can matter for your residence permit. A migration advice centre can explain your situation.'],
    },
    {
      id: 'gemeinde',
      slug: 'gemeinde',
      name: 'Town or village administration',
      local: 'Gemeinde / Gemeindeverwaltung',
      about: 'Your town or village. It sends bills for waste, water or the dog tax, and handles many local matters.',
      patterns: [/gemeindeverwaltung/i, /gemeindekanzlei/i, /stadtverwaltung/i, /stadtkanzlei/i, /einwohnergemeinde/i, /politische gemeinde/i, /\bgemeinderat\b/i, /kehricht/i, /abfallgebühr/i, /hundesteuer|hundeabgabe/i, /abwassergebühr/i],
      letters: ['Gebührenrechnung — a bill for waste, water or sewage', 'Hundesteuer — the yearly dog tax', 'Mitteilung — information from the town'],
      tips: ['Many towns sell special bags or stickers for rubbish. Using normal bags can lead to a fine.'],
    },
    {
      id: 'vermieter',
      slug: 'liegenschaftsverwaltung',
      name: 'Landlord or property manager',
      local: 'Vermieter / Liegenschaftsverwaltung',
      about: 'The owner of your flat or the company that manages it.',
      patterns: [/liegenschaftsverwaltung/i, /immobilienverwaltung/i, /\bverwaltung\b/i, /vermieter/i, /mietvertrag/i, /mietzins/i, /nebenkostenabrechnung/i, /heizkostenabrechnung/i, /mietobjekt/i, /\bmieter/i, /\blivit\b/i, /\bwincasa\b/i, /\bprivera\b/i],
      letters: ['Mietzinserhöhung — a rent increase; it must come on an official form', 'Nebenkostenabrechnung — the yearly bill for heating, hot water and other costs', 'Kündigung — notice to end your rental contract'],
      tips: ['A rent increase or a notice from the landlord must come on the official cantonal form. You can challenge it at the conciliation office (Schlichtungsbehörde) within 30 days.', 'Your deposit (Mietzinsdepot) can be at most 3 months’ rent and must be in a bank account in your name.'],
    },
    {
      id: 'versorger',
      slug: 'energieversorger',
      name: 'Energy supplier',
      local: 'Elektrizitätswerk / Energieversorger',
      about: 'The company that supplies your electricity, and sometimes gas, water or heating. Often it belongs to your town or canton.',
      patterns: [/elektrizitätswerk/i, /elektrizitaetswerk/i, /energieversorg/i, /stromrechnung/i, /stromlieferung/i, /netznutzung/i, /zählerstand/i, /\bkWh\b/, /\bEWZ\b/, /\bEKZ\b/, /\bBKW\b/, /\bCKW\b/, /\bIWB\b/, /industrielle betriebe/i, /werkbetriebe/i],
      letters: ['Stromrechnung — the bill for electricity', 'Akontorechnung — an advance payment; your real use is billed later', 'Schlussrechnung — the final bill when you move out'],
      tips: ['When you move out, give them the meter reading (Zählerstand) on the day you leave.'],
    },
    {
      id: 'inkasso',
      slug: 'inkasso',
      name: 'Debt collection agency',
      local: 'Inkassobüro',
      about: 'A private company that collects money for someone else. It can’t seize anything itself — only the Betreibungsamt can.',
      patterns: [/inkasso/i, /intrum/i, /\bEOS\b/, /lowell/i, /creditreform/i, /forderungsmanagement/i],
      letters: ['Zahlungsaufforderung — they ask you to pay a debt plus fees', 'Letzte Mahnung vor Betreibung — they will start debt collection if you don’t pay'],
      tips: ['Ask for proof of the original debt if you don’t recognise it.', 'Extra collection fees are often not owed unless your contract says so. A debt advice centre can check.'],
    },
  ],
  kinds: [
    {
      id: 'zahlungsbefehl', type: 'court-order', local: 'Zahlungsbefehl', name: 'Payment order (debt collection)', about: 'Someone has started debt collection (Betreibung) against you. If you don’t owe the money, you must object within 10 days — otherwise they can seize your wages or things.', urgency: 'high', patterns: [/zahlungsbefehl/i, /rechtsvorschlag/i, /betreibungsbegehren/i],
      steps: ['If you don’t owe this money, or only part of it, file a Rechtsvorschlag within 10 days after you received it. You can tell the person who hands you the Zahlungsbefehl, or tell or write to the Betreibungsamt. You don’t need to give a reason.', 'The 10 days are set by law and can’t be extended. If you send a letter, post it by the 10th day at the latest — best by registered post (Einschreiben).', 'If you owe the money, pay it, or ask the creditor for a payment plan. If you do nothing, the creditor can ask for a seizure (Pfändung) of your wages or things.'],
    },
    {
      id: 'pfaendung', type: 'enforcement', local: 'Pfändungsankündigung / Pfändung', name: 'Seizure notice', about: 'The Betreibungsamt will seize part of your wages or things to pay a debt. The letter gives the date of the seizure.', urgency: 'high', patterns: [/pfändungsankündigung/i, /pfaendungsankuendigung/i, /pfändungsurkunde/i, /lohnpfändung/i, /pfändung/i, /pfaendung/i],
      steps: ['Be there on the date in the letter, or send someone with a written power of attorney. You must tell them what you earn and own.', 'You can still stop it by paying the full amount to the Betreibungsamt before that date.', 'They must leave you the minimum you need to live (Existenzminimum).'],
    },
    {
      id: 'ordnungsbusse', type: 'fine', objection: false, local: 'Ordnungsbusse', name: 'Fixed fine', about: 'A fixed fine for a small offence, for example parking or speeding a little. It doesn’t go on your criminal record.', urgency: 'medium', patterns: [/ordnungsbusse/i, /ordnungsbussenverfahren/i, /bedenkfrist/i],
      steps: ['Pay within the period on the slip, usually 30 days. Then the case is closed.', 'If you don’t pay in time, a normal procedure starts. It costs more, because fees are added.'],
    },
    {
      id: 'strafbefehl', type: 'fine', local: 'Strafbefehl', name: 'Penalty order', about: 'A penalty from the prosecutor or a fines office. If you don’t object within 10 days, it becomes final like a court judgment.', urgency: 'high', patterns: [/strafbefehl/i],
      steps: ['If you accept it, pay the fine and the costs as the letter says.', 'If you disagree, send an Einsprache in writing within 10 days after you received it. If you don’t, it becomes final.'],
    },
    {
      id: 'veranlagung', type: 'tax-assessment', local: 'Veranlagungsverfügung / Steuerrechnung', name: 'Tax assessment', about: 'The result of your tax return: how much tax you owe. You can usually object (Einsprache) within 30 days.', urgency: 'medium', patterns: [/veranlagungsverfügung/i, /veranlagung/i, /einschätzungsentscheid/i, /steuerrechnung/i],
      steps: ['Check the income, wealth and deductions they used. If something is wrong, send an Einsprache, usually within 30 days — check the deadline at the end of the letter.'],
    },
    {
      id: 'mahnung', type: 'reminder', local: 'Mahnung', name: 'Payment reminder', about: 'You have not paid something on time. Fees can be added, and the next step is often debt collection (Betreibung).', urgency: 'high', patterns: [/mahnung/i, /zahlungserinnerung/i, /mahngebühr/i, /mahnspesen/i, /zahlungsrückstand/i, /noch keine zahlung/i, /noch nicht bezahlt/i, /noch nicht beglichen/i, /ausstehende[nr]? (?:betrag|prämie|zahlung)/i],
      steps: ['If you don’t pay, they can start a Betreibung. It then shows up in the debt collection register.'],
    },
    {
      id: 'praemienrechnung', type: 'bill', local: 'Prämienrechnung', name: 'Health insurance bill', about: 'Your health insurance premium. Basic insurance is required by law, so you must pay it even if you don’t see a doctor.', urgency: 'medium', patterns: [/prämienrechnung/i, /praemienrechnung/i, /monatsprämie/i],
      steps: ['If your income is low, check if your canton can help pay your premiums (Prämienverbilligung).'],
    },
    {
      id: 'vorladung', type: 'appointment', local: 'Vorladung', name: 'Summons', about: 'You must come to the police, the prosecutor or a court, for example for questioning.', urgency: 'high', patterns: [/vorladung/i, /vorgeladen/i, /einvernahme/i],
      steps: ['You must go. If you really can’t, tell them right away and give a reason with proof.', 'If you are accused of something, you can stay silent and you can have a lawyer. Get advice first.'],
    },
    {
      id: 'kuendigung', type: 'termination', local: 'Kündigung', name: 'Termination notice', about: 'A contract is being ended, for example your flat, your job or an insurance.', urgency: 'high', patterns: [/kündigung/i, /kuendigung/i, /kündigen wir/i],
      steps: ['If it’s from your landlord: a notice for a flat is only valid on the official cantonal form.', 'You can challenge a landlord’s notice, or ask for more time to move out (Erstreckung), at the conciliation office (Schlichtungsbehörde) within 30 days after you received it.'],
    },
    {
      id: 'nebenkosten', type: 'utility-bill', local: 'Nebenkostenabrechnung', name: 'Yearly utility bill', about: 'Your landlord’s yearly bill for heating, hot water and other shared costs. You may pay extra or get money back.', urgency: 'medium', patterns: [/nebenkostenabrechnung/i, /heizkostenabrechnung/i, /heiz- und nebenkosten/i],
      steps: ['Check the bill carefully. You can ask to see the receipts (Belege). Your rental contract may say how long you have to question it.'],
    },
    {
      id: 'einladung', type: 'appointment', local: 'Einladung / Beratungsgespräch', name: 'Appointment', about: 'They want you to come to an appointment. If the RAV invites you, you must go.', urgency: 'medium', patterns: [/(?<!abholungs)einladung/i, /beratungsgespräch/i, /beratungsgespraech/i, /informationsveranstaltung/i, /laden wir sie/i, /bitten wir sie,? (?:am|zu)/i, /persönlich vorzusprechen/i, /vorsprache/i],
      steps: ['If the RAV invited you and you miss it without a good reason, you can lose days of benefits (Einstelltage).'],
    },
    { id: 'unterlagen', type: 'documents', local: 'Unterlagen', name: 'Request for documents', about: 'They need papers or information from you before they can decide.', urgency: 'medium', patterns: [/fehlende unterlagen/i, /folgende unterlagen/i, /unterlagen .{0,40}(?:einzureichen|nachzureichen|zuzustellen)/i, /reichen sie .{0,60} ein/i, /bitte senden sie uns/i, /benötigen wir/i, /mitwirkungspflicht/i] },
    { id: 'rechtliches-gehoer', type: 'hearing', local: 'Rechtliches Gehör', name: 'Chance to explain', about: 'They plan to decide something about you and let you give your view first. This often comes from the migration office.', urgency: 'medium', patterns: [/rechtliche[ns]? gehör/i, /rechtliche[ns]? gehoer/i, /gelegenheit zur stellungnahme/i, /stellung zu nehmen/i] },
    { id: 'abweisung', type: 'rejection', local: 'Abweisung / Ablehnung', name: 'Rejection', about: 'Your request was turned down. You can usually object if you think this is wrong.', urgency: 'medium', patterns: [/abgewiesen/i, /abweisung/i, /wird abgelehnt/i, /ablehnung/i, /nicht entsprochen/i] },
    { id: 'rechnung', type: 'bill', local: 'Rechnung', name: 'Bill', about: 'A bill. It tells you how much to pay and by when. Most Swiss bills have a QR code you can scan with your banking app.', urgency: 'medium', weight: 0.6, patterns: [/\brechnung\b/i, /rechnungsbetrag/i, /qr-rechnung/i, /\bzahlteil\b/i] },
    { id: 'verfuegung', type: 'decision', local: 'Verfügung', name: 'Official decision', about: 'A formal decision by an office. It becomes final unless you object in time.', urgency: 'medium', weight: 0.4, patterns: [/verfügung/i, /verfuegung/i, /\bentscheid\b/i] },
  ],
  references: [
    { name: 'Debt collection number', local: 'Betreibungsnummer', pattern: /(?:betreibungsnummer|betreibungs-nr\.?|betreibung nr\.?)/gi },
    { name: 'Payment reference', local: 'Referenznummer', payment: true, pattern: /(?:referenznummer|referenz-nr\.?|zahlungsreferenz|qr-referenz)/gi },
    { name: 'Insured person number', local: 'Versichertennummer', pattern: /(?:versichertennummer|versicherten-nr\.?|versicherungsnummer)/gi },
    { name: 'Policy number', local: 'Policennummer', pattern: /(?:policennummer|policen-nr\.?|police nr\.?)/gi },
    { name: 'Customer number', local: 'Kundennummer', pattern: /(?:kundennummer|kunden-nr\.?)/gi },
    { name: 'Social security number', local: 'AHV-Nummer', pattern: /(?:ahv-?nummer|ahv-?nr\.?|ahvn13|sozialversicherungsnummer)/gi },
    { name: 'Tax number', local: 'Steuernummer', pattern: /(?:steuernummer|steuer-nr\.?)/gi },
    { name: 'Register number', local: 'Registernummer', pattern: /(?:registernummer|register-nr\.?)/gi },
    { name: 'Case number', local: 'Geschäftsnummer', pattern: /(?:geschäftsnummer|geschäfts-nr\.?|dossiernummer|dossier-nr\.?|fallnummer|verfahrensnummer|aktenzeichen)/gi },
    { name: 'Invoice number', local: 'Rechnungsnummer', pattern: /(?:rechnungsnummer|rechnungs-nr\.?)/gi },
    { name: 'Contract number', local: 'Vertragsnummer', pattern: /(?:vertragsnummer|vertrags-nr\.?)/gi },
    { name: 'Property number', local: 'Objektnummer', pattern: /(?:objektnummer|objekt-nr\.?)/gi },
  ],
  glossary: [
    { term: 'Betreibung', slug: 'betreibung', pattern: /betreibung/i, meaning: 'Debt collection through the state. Anyone who says you owe them money can start one — without proof.', tip: 'Never ignore it. A Betreibung shows up in the register that landlords check, even if you don’t owe the money.' },
    { term: 'Zahlungsbefehl', slug: 'zahlungsbefehl', pattern: /zahlungsbefehl/i, meaning: 'Payment order in a debt collection. It is not a court decision: nobody has checked yet if the debt is real.' },
    { term: 'Rechtsvorschlag', slug: 'rechtsvorschlag', pattern: /rechtsvorschlag/i, meaning: 'Your objection to a Zahlungsbefehl. It stops the debt collection until a court or office decides.', tip: 'Tell the person who brings the Zahlungsbefehl, or tell or write to the Betreibungsamt within 10 days. It’s free and needs no reason.' },
    { term: 'Betreibungsamt', slug: 'betreibungsamt', pattern: /betreibungsamt|betreibungs- und konkursamt/i, meaning: 'Debt collection office. A state office for your area.' },
    { term: 'Betreibungsregisterauszug', slug: 'betreibungsregisterauszug', pattern: /betreibungsregister/i, meaning: 'Extract from the debt collection register. Landlords and employers often ask for it.' },
    { term: 'Pfändung', slug: 'pfaendung', pattern: /pfändung|pfaendung|pfänden/i, meaning: 'Seizure. The Betreibungsamt takes part of your wages or things to pay a debt.', tip: 'They must leave you the minimum you need to live (Existenzminimum). Get free debt advice early.' },
    { term: 'Verlustschein', slug: 'verlustschein', pattern: /verlustschein/i, meaning: 'Certificate of loss. It shows a debt that could not be collected. The creditor can try again for up to 20 years.' },
    { term: 'Gläubiger', slug: 'glaeubiger', pattern: /gläubiger|glaeubiger/i, meaning: 'Creditor. The person or company that says you owe them money.' },
    { term: 'Verfügung', slug: 'verfuegung', pattern: /verfügung|verfuegung/i, meaning: 'Formal decision by an office. It becomes final if you don’t object in time.', tip: 'Read the end of the letter (Rechtsmittelbelehrung). It says how, where and by when you can object.' },
    { term: 'Rechtsmittelbelehrung', slug: 'rechtsmittelbelehrung', pattern: /rechtsmittelbelehrung/i, meaning: 'The part at the end of a decision that tells you how, where and by when you can object.' },
    { term: 'Einsprache', slug: 'einsprache', pattern: /einsprache/i, meaning: 'Objection. You ask the same office to look at its decision again.', tip: 'Send it in writing and signed, before the deadline (often 30 days). Say what should change and why.' },
    { term: 'Rekurs', slug: 'rekurs', pattern: /\brekurs/i, meaning: 'Appeal. You ask a higher office or a court to change a decision.' },
    { term: 'Beschwerde', slug: 'beschwerde', pattern: /beschwerde/i, meaning: 'Appeal or complaint to a higher office or a court.' },
    { term: 'innert', slug: 'innert', pattern: /\binnert\b/i, meaning: 'Within. “Innert 10 Tagen” means within 10 days.', tip: 'The days start on the day after you receive the letter.' },
    { term: 'Frist', slug: 'frist', pattern: /\bfrist/i, meaning: 'Deadline.', tip: 'Deadlines set by law can’t be extended. If the office set the deadline, you can ask for more time (Fristerstreckung) before it ends.' },
    { term: 'Zustellung', slug: 'zustellung', pattern: /zustellung|zugestellt/i, meaning: 'Delivery of the letter to you. Many deadlines start on the day after.' },
    { term: 'Einschreiben', slug: 'einschreiben', pattern: /einschreiben|eingeschrieben/i, meaning: 'Registered letter. You sign when you get it.' },
    { term: 'Abholungseinladung', slug: 'abholungseinladung', pattern: /abholungseinladung/i, meaning: 'A note from the post that a letter is waiting for you. You have 7 days to pick it up.', tip: 'If you don’t pick it up, it can still count as delivered on the 7th day. Deadlines then start anyway.' },
    { term: 'Veranlagung', slug: 'veranlagung', pattern: /veranlagung/i, meaning: 'Tax assessment. The office’s calculation of your tax, based on your tax return.' },
    { term: 'Steuererklärung', slug: 'steuererklaerung', pattern: /steuererklärung|steuererklaerung/i, meaning: 'Tax return. The form where you list your income and wealth. The deadline is usually in spring.' },
    { term: 'Quellensteuer', slug: 'quellensteuer', pattern: /quellensteuer/i, meaning: 'Tax taken directly from your salary. Common for people with a B or L permit.' },
    { term: 'AHV', slug: 'ahv', pattern: /\bAHV\b/, meaning: 'The Swiss state pension (old-age and survivors’ insurance). Almost everyone who lives or works in Switzerland pays into it.' },
    { term: 'IV', slug: 'iv', pattern: /\bIV\b/, meaning: 'Disability insurance. It is run together with the AHV.' },
    { term: 'Grundversicherung', slug: 'grundversicherung', pattern: /grundversicherung|krankenpflegeversicherung/i, meaning: 'Basic health insurance. It’s required by law for everyone who lives in Switzerland.', tip: 'The cover is the same at every insurer — only the price differs. You can change insurer for the next year.' },
    { term: 'Prämie', slug: 'praemie', pattern: /\bprämie|\bpraemie/i, meaning: 'Premium. The amount you pay for insurance, usually every month.' },
    { term: 'Franchise', slug: 'franchise', pattern: /franchise/i, meaning: 'Deductible. The part of your medical costs you pay yourself each year before the insurance pays. A higher Franchise means a lower premium.' },
    { term: 'Selbstbehalt', slug: 'selbstbehalt', pattern: /selbstbehalt/i, meaning: 'Your share of the costs after the Franchise: 10%, up to a yearly limit.' },
    { term: 'Prämienverbilligung', slug: 'praemienverbilligung', pattern: /prämienverbilligung|praemienverbilligung/i, meaning: 'Money from your canton to help pay health insurance if your income is low. In many cantons you must apply yourself.' },
    { term: 'Serafe', slug: 'serafe', pattern: /serafe/i, meaning: 'The company that collects the radio and TV fee from every household.' },
    { term: 'Ordnungsbusse', slug: 'ordnungsbusse', pattern: /ordnungsbusse/i, meaning: 'Fixed fine for a small offence, for example parking. It doesn’t go on your criminal record.', tip: 'Pay it within the deadline, usually 30 days. If you don’t, a normal procedure starts and it costs more.' },
    { term: 'Strafbefehl', slug: 'strafbefehl', pattern: /strafbefehl/i, meaning: 'Penalty order from the prosecutor or a fines office. If you don’t object, it counts as a final judgment.', tip: 'If you disagree, send an Einsprache in writing within 10 days.' },
    { term: 'Vorladung', slug: 'vorladung', pattern: /vorladung/i, meaning: 'Summons. You must come to the police, the prosecutor or a court.' },
    { term: 'Einwohnerkontrolle', slug: 'einwohnerkontrolle', pattern: /einwohnerkontrolle|einwohneramt|einwohnerdienste/i, meaning: 'Residents’ office of your town. You register here within 14 days when you move in, and tell them when you move out.' },
    { term: 'Ausländerausweis', slug: 'auslaenderausweis', pattern: /ausländerausweis|auslaenderausweis/i, meaning: 'Permit card for foreigners. L = short stay, B = residence, C = settlement, G = cross-border worker.' },
    { term: 'Gemeinde', slug: 'gemeinde', pattern: /\bgemeinde/i, meaning: 'Your town or village (municipality).' },
    { term: 'Kanton', slug: 'kanton', pattern: /\bkanton/i, meaning: 'One of the 26 states of Switzerland. Taxes and many rules differ by canton.' },
    { term: 'RAV', slug: 'rav', pattern: /\bRAV\b/, meaning: 'Regional employment centre. It helps you find work and checks that you are looking for a job.' },
    { term: 'Arbeitslosenkasse', slug: 'arbeitslosenkasse', pattern: /arbeitslosenkasse/i, meaning: 'Unemployment fund. It pays your unemployment money.' },
    { term: 'Taggeld', slug: 'taggeld', pattern: /\btaggeld/i, meaning: 'Daily allowance. Unemployment money is counted per working day.' },
    { term: 'Einstelltage', slug: 'einstelltage', pattern: /einstelltag|einstellung in der anspruchsberechtigung/i, meaning: 'Days without unemployment money, as a penalty — for example after a missed appointment.' },
    { term: 'Arbeitsbemühungen', slug: 'arbeitsbemuehungen', pattern: /arbeitsbemühungen|arbeitsbemuehungen/i, meaning: 'Your job applications. You must show them to the RAV every month, by the 5th of the next month.' },
    { term: 'Mahnung', slug: 'mahnung', pattern: /mahnung/i, meaning: 'Payment reminder. You paid late or not at all.', tip: 'Check if you already paid. If not, pay soon — fees and debt collection (Betreibung) can follow.' },
    { term: 'Ratenzahlung', slug: 'ratenzahlung', pattern: /ratenzahlung|abzahlungsvereinbarung|in raten/i, meaning: 'Paying in instalments.' },
    { term: 'Stundung', slug: 'stundung', pattern: /stundung/i, meaning: 'Postponing a payment.' },
    { term: 'Mietzinsdepot', slug: 'mietzinsdepot', pattern: /mietzinsdepot|mietkaution|\bkaution/i, meaning: 'Rental deposit (Kaution). At most 3 months’ rent, kept in a bank account in your name.' },
    { term: 'Kündigung', slug: 'kuendigung', pattern: /kündigung|kuendigung/i, meaning: 'Notice that ends a contract.', tip: 'A landlord’s notice for a flat must come on the official cantonal form. You can challenge it within 30 days at the conciliation office.' },
    { term: 'Nebenkosten', slug: 'nebenkosten', pattern: /nebenkosten/i, meaning: 'Extra costs on top of the rent, like heating and hot water.' },
    { term: 'Schlichtungsbehörde', slug: 'schlichtungsbehoerde', pattern: /schlichtungsbehörde|schlichtungsstelle/i, meaning: 'Conciliation office for disputes, for example with your landlord. For rent disputes it costs nothing.' },
    { term: 'Rechtliches Gehör', slug: 'rechtliches-gehoer', pattern: /rechtliche[ns]? gehör/i, meaning: 'Your right to give your view before an office decides about you.' },
    { term: 'QR-Rechnung', slug: 'qr-rechnung', pattern: /qr-rechnung|zahlteil/i, meaning: 'Swiss bill with a payment part and a QR code. Scan the code with your banking app to pay.' },
  ],
  samples: [
    {
      id: 'betreibung',
      title: 'Debt collection office',
      subtitle: 'Payment order (Zahlungsbefehl)',
      build(today) {
        const letter = addDays(today, -5);
        const interestFrom = addDays(letter, -120);
        return `Betreibungsamt Musterwil
Bahnhofstrasse 10 · Postfach · CH-8999 Musterwil
Tel. 052 000 00 00 · betreibungsamt@musterwil.ch

Musterwil, ${swissDate(letter)}

Zahlungsbefehl
Betreibung Nr. 26012345

Schuldner
Herr
Daniel Beispiel
Mustergasse 7
CH-8999 Musterwil

Gläubiger
Beispiel Mobil AG, Industriestrasse 3, CH-8998 Beispielstadt

Forderung
CHF 1'240.50 nebst Zins zu 5 % seit ${swissDate(interestFrom)}
Grund der Forderung: Unbezahlte Rechnungen für das Mobilfunk-Abo, Kundennummer 5512-4471
Kosten dieses Zahlungsbefehls: CHF 73.30

Der Schuldner wird aufgefordert, den Gläubiger für die Forderung samt Zins und Betreibungskosten innert 20 Tagen seit der Zustellung zu befriedigen. Die Zahlung kann auch an das Betreibungsamt erfolgen:
Kontoinhaber: Betreibungsamt Musterwil
IBAN: CH76 0900 0000 1234 5678 9
Bitte geben Sie bei der Zahlung die Betreibungsnummer an.

Will der Schuldner die Forderung ganz oder teilweise bestreiten, so hat er dies sofort dem Überbringer oder innert 10 Tagen seit der Zustellung dem Betreibungsamt mündlich oder schriftlich zu erklären (Rechtsvorschlag). Wird nur ein Teil bestritten, ist der bestrittene Betrag genau anzugeben. Der Rechtsvorschlag muss nicht begründet werden.

Wird weder bezahlt noch Rechtsvorschlag erhoben, kann der Gläubiger nach Ablauf von 20 Tagen seit der Zustellung die Fortsetzung der Betreibung verlangen. Das Betreibungsamt kann dann Lohn oder Vermögen pfänden.

Betreibungsamt Musterwil
Der Betreibungsbeamte`;
      },
    },
    {
      id: 'krankenkasse',
      title: 'Health insurance',
      subtitle: 'Premium reminder (Mahnung)',
      build(today) {
        const letter = addDays(today, -4);
        const due = nextWorkday(addDays(today, 10));
        const month = monthYear(addMonths(today, -1));
        return `Musterkasse Krankenversicherung AG
Abteilung Prämien · Postfach · CH-6999 Musterhausen
www.musterkasse.ch

Frau
Anna Muster
Lindenweg 12
CH-3999 Beispielberg

Versichertennummer: 801234567
AHV-Nr.: 756.1234.5678.97
Rechnungsnummer: 2026-104-55871
Datum: ${swissDate(letter)}

Mahnung
Obligatorische Krankenpflegeversicherung (Grundversicherung nach KVG)

Guten Tag Frau Muster

Für die folgende Prämie haben wir bis heute noch keine Zahlung erhalten:

Prämie Grundversicherung ${month}: CHF 386.40
Mahngebühr: CHF 20.00
Total offener Betrag: CHF 406.40

Bitte bezahlen Sie den offenen Betrag bis am ${swissDate(due)} mit dem QR-Zahlteil unten. Wenn Sie die Prämie in den letzten Tagen bereits bezahlt haben, betrachten Sie diese Mahnung als gegenstandslos.

Erhalten wir bis zu diesem Datum keine Zahlung, leiten wir die Betreibung ein. Die Kosten dafür gehen zu Ihren Lasten. Solange Prämien offen sind, können Sie die Krankenkasse nicht wechseln.

Haben Sie Zahlungsschwierigkeiten? Rufen Sie uns an. Wir finden gerne eine Lösung, zum Beispiel eine Ratenzahlung.

Freundliche Grüsse
Musterkasse Krankenversicherung AG

Zahlteil
Konto / Zahlbar an
CH73 3000 0012 3456 7890 1
Musterkasse Krankenversicherung AG
CH-6999 Musterhausen
Referenz
00 00000 00000 12345 67890 12343
Zahlbar durch
Anna Muster, Lindenweg 12, CH-3999 Beispielberg
Währung Betrag
CHF 406.40`;
      },
    },
  ],
  replies: {
    you: { name: '[Ihr Vorname Nachname]', street: '[Ihre Strasse und Hausnummer]', city: '[Ihre PLZ und Ihr Ort]', place: '[Ihr Ort]' },
    closing: ['Freundliche Grüsse', '', '', '[Unterschrift]', '[Ihr Vorname Nachname]'],
    objection: {
      subject: (term, of) => (term === 'Rechtsvorschlag' ? `Rechtsvorschlag gegen den Zahlungsbefehl ${of}` : `${term} gegen Ihre Verfügung ${of}`),
      body: (term, of) => (term === 'Rechtsvorschlag'
        ? [
          `hiermit erhebe ich Rechtsvorschlag gegen den Zahlungsbefehl ${of}.`,
          '',
          'Bitte bestätigen Sie mir den Eingang dieses Schreibens.',
        ]
        : [
          `hiermit erhebe ich ${term} gegen Ihre Verfügung ${of}.`,
          '',
          'Antrag: [Was soll geändert werden? Zum Beispiel: Die Verfügung sei aufzuheben.]',
          '',
          'Begründung: [Erklären Sie in wenigen Sätzen, warum die Verfügung falsch ist. Legen Sie Belege bei, wenn Sie welche haben.]',
          '',
          'Bitte bestätigen Sie mir den Eingang dieses Schreibens.',
        ]),
    },
    moreTime: {
      name: 'Fristerstreckung',
      subject: 'Gesuch um Fristerstreckung',
      body: (of, deadline) => [
        `in Ihrem Schreiben ${of} haben Sie mir eine Frist bis zum ${deadline ?? '[Datum]'} gesetzt.`,
        'Leider kann ich diese Frist nicht einhalten, weil [Grund, zum Beispiel: mir noch Unterlagen fehlen / ich krank bin].',
        '',
        'Ich ersuche Sie daher, die Frist bis zum [neues Datum] zu erstrecken.',
        '',
        'Vielen Dank für Ihr Verständnis.',
      ],
    },
    instalments: {
      subject: 'Gesuch um Ratenzahlung',
      body: (of, amount) => [
        `in Ihrem Schreiben ${of} fordern Sie mich auf, ${amount ?? '[Betrag]'} zu bezahlen.`,
        'Leider kann ich den Betrag wegen meiner finanziellen Situation nicht auf einmal bezahlen.',
        '',
        'Ich schlage Ihnen vor, den Betrag in monatlichen Raten von [Betrag] zu bezahlen. Die erste Rate bezahle ich am [Datum].',
        '',
        'Bitte teilen Sie mir mit, ob Sie damit einverstanden sind.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'rechtsvorschlag',
      replaces: 'objection',
      title: 'Object to the debt collection (Rechtsvorschlag)',
      advice: 'Use this if you don’t owe the money, or only part of it. Post it to the Betreibungsamt within 10 days after you got the Zahlungsbefehl, best by registered post (Einschreiben). You don’t need to give a reason.',
      english: 'In debt collection number [number], I object to the payment order (Rechtsvorschlag). [If you owe part of it: I only dispute CHF [amount].] Please confirm that you received my objection.',
      subject: 'Rechtsvorschlag',
      body(result) {
        const number = result.references?.find((reference) => reference.local === 'Betreibungsnummer')?.value ?? '[Nummer]';
        const date = result.letterDate ? swissDate(result.letterDate) : '[TT.MM.JJJJ]';
        return [
          `in der Betreibung Nr. ${number} erhebe ich Rechtsvorschlag gegen den Zahlungsbefehl vom ${date}.`,
          '',
          '[Nur wenn Sie einen Teil schulden: Ich bestreite die Forderung im Betrag von CHF [Betrag].]',
          '',
          'Bitte bestätigen Sie mir den Eingang meines Rechtsvorschlags.',
        ];
      },
      when: (result) => result.kind?.id === 'zahlungsbefehl',
    },
  ],
};
