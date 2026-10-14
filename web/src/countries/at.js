import { addDays, formatLocalDate, fromIso } from '../dates.js';

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

const local = (iso) => formatLocalDate(iso, '.');

const euro = (amount) => new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(amount);

const objectOf = (term) => (term === 'Einspruch' ? 'Ihr Schreiben' : 'den Bescheid');

export default {
  id: 'at',
  slug: 'austria',
  name: 'Austria',
  adjective: 'Austrian',
  flag: '🇦🇹',
  language: 'de',
  currency: 'EUR',
  decimal: ',',
  thousands: '.',
  dateSeparator: '.',
  ibanLength: 20,
  intro: 'Austrian offices write formal letters with short, strict deadlines. Most decisions (Bescheid) become final after 4 weeks or one month unless you object in writing (Beschwerde).',
  signals: [
    /österreich/i,
    /[a-z0-9-]\.at\b/i,
    /\bAT\d{2}\s?\d{4}/,
    /\b(?:A-)?[1-9]\d{3}\s+(?:Wien|Graz|Linz|Salzburg|Innsbruck|Klagenfurt|Villach|Wels|St\.\s?Pölten|Sankt Pölten|Dornbirn|Steyr|Wiener Neustadt|Feldkirch|Bregenz|Leoben|Krems|Eisenstadt|Klosterneuburg|Leonding|Wolfsberg|Amstetten|Lustenau|Kapfenberg|Mödling|Hallein|Kufstein|Traun|Schwechat|Tulln|Bludenz|Gmunden|Wörgl|Leibnitz|Vöcklabruck)\b/,
    /\bWien\b/,
    /\bAMS\b/,
    /arbeitsmarktservice/i,
    /bezirkshauptmannschaft/i,
    /magistrat(?:isches bezirksamt|sabteilung)/i,
    /\bMA\s?(?:35|40|67)\b/,
    /rot-wei(?:ß|ss)-rot/i,
    /parteiengehör/i,
    /lenkberechtigung/i,
    /ÖGK|gesundheitskasse/i,
    /e-card/i,
    /meldezettel/i,
    /finanzonline/i,
    /orf-beitrag/i,
    /jänner|\bfeber\b/i,
    /verwaltungsübertretung/i,
    /anonymverfügung|organstrafverfügung|organmandat/i,
    /geschäftszahl/i,
    /exekution/i,
    /pensionsversicherungsanstalt/i,
    /sozialversicherung der selbständigen/i,
    /\bATU\d{8}\b/,
  ],
  deliveryDays: 3,
  deliveryNote: 'In Austria, an official letter sent by normal post usually counts as delivered on the 3rd working day after it was posted. A registered letter (RSa or RSb) counts as delivered on the day you get it — or, if you were not home, usually on the first day you can pick it up at the post office.',
  objection: [
    { word: 'Beschwerde', pattern: /beschwerde[^.\n]{0,120}(?:erheben|einbringen|einzubringen|einlegen|erhoben|eingebracht)|rechtsmittel der beschwerde|bescheidbeschwerde/i },
    { word: 'Vorstellung', pattern: /\bvorstellung\b[^.\n]{0,80}(?:erheben|einbringen|einzubringen|erhoben|eingebracht)|rechtsmittel der vorstellung|mandatsbescheid/i },
    { word: 'Einspruch', pattern: /einspruch/i },
    { word: 'Beschwerde', pattern: /beschwerde/i },
  ],
  objectionAdvice: 'Use this if you think the decision is wrong. Send it to the office that made the decision before the deadline, signed, and keep a copy. Write your reasons and what you want in the letter — a Beschwerde needs them.',
  help: {
    debt: 'a free debt advice service (Schuldenberatung) in your province',
    tenant: 'a tenants’ association (Mietervereinigung or Mieterschutzverband)',
    instalments: 'Ratenzahlung',
    general: 'a free advice service such as the Arbeiterkammer (free for employees) or a migrant advice centre',
  },
  cancelTips: [
    'A written cancellation is always enough. The company can’t ask for more, like a registered letter.',
    'Contracts for regular deliveries, like energy or magazines, that run longer than 1 year or have no end date: you can cancel with 2 months’ notice to the end of the first year, and after that to the end of every half year.',
    'Phone and internet: the minimum term can be at most 24 months, and the notice period at most 1 month.',
    'Insurance that runs longer than 3 years: you can cancel at the end of the 3rd year or any later year, with 1 month’s notice. You may have to pay back discounts.',
    'Car insurance renews by itself for another year, unless you cancel at least 1 month before it ends.',
  ],
  senders: [
    {
      id: 'finanzamt',
      slug: 'finanzamt',
      name: 'Tax office',
      local: 'Finanzamt Österreich',
      about: 'Handles income tax and other taxes. There is one tax office for all of Austria, with local branches.',
      patterns: [/finanzamt/i, /finanzonline/i, /einkommensteuer/i, /arbeitnehmerveranlagung/i, /abgabenkonto/i, /bundesministerium für finanzen/i, /bmf\.gv\.at/i],
      letters: ['Einkommensteuerbescheid — the result of your tax return', 'Ergänzungsersuchen — they need more information or proof', 'Buchungsmitteilung — an update on your tax account', 'Säumniszuschlag — a late fee because you paid tax late'],
      tips: ['You can object (Beschwerde) within one month after delivery. Objecting does not stop the payment — ask for a pause (Aussetzung der Einhebung) if you need it.', 'If you use FinanzOnline, letters in your Databox usually count as delivered when they arrive there. Check it often.'],
    },
    {
      id: 'familienbeihilfe',
      slug: 'familienbeihilfe',
      name: 'Family benefits',
      local: 'Familienbeihilfe (Finanzamt Österreich)',
      about: 'The tax office pays child benefit (Familienbeihilfe) together with the child tax credit (Kinderabsetzbetrag).',
      patterns: [/familienbeihilfe/i, /kinderabsetzbetrag/i],
      letters: ['Mitteilung über den Bezug der Familienbeihilfe — what you get and until when', 'Überprüfung des Anspruchs — they check if you still qualify and need proof', 'Rückforderung — they want money back'],
      tips: ['Send the review form and the proof back in time, or the payments can stop.', 'Tell them at once if your child stops school or training, moves out or leaves Austria.'],
    },
    {
      id: 'ams',
      slug: 'ams',
      name: 'Public employment service',
      local: 'AMS (Arbeitsmarktservice)',
      about: 'Pays unemployment benefit (Arbeitslosengeld) and Notstandshilfe, and helps you find work.',
      patterns: [/\bAMS\b/, /arbeitsmarktservice/i, /arbeitslosengeld/i, /notstandshilfe/i, /kontrollmeldung/i, /vermittlungsvorschlag/i],
      letters: ['Einladung — a required appointment with your adviser', 'Mitteilung über den Leistungsanspruch — how much you get and from when', 'Vermittlungsvorschlag — a job offer you must apply for', 'Bescheid über den Verlust des Anspruchs — your payments stop for some weeks'],
      tips: ['If you miss an appointment without a good reason, your payments can stop until you contact them again. If you are ill, tell them before the appointment.', 'Apply for every job they send you (Vermittlungsvorschlag) and keep proof. Otherwise your payments can stop for several weeks.'],
    },
    {
      id: 'magistrat',
      slug: 'magistrat-bezirkshauptmannschaft',
      name: 'City or district authority',
      local: 'Magistrat / Bezirkshauptmannschaft',
      about: 'Your local authority. In big cities it is the Magistrat, elsewhere the Bezirkshauptmannschaft (BH). It handles many things, for example fines, driving licences and permits.',
      patterns: [/bezirkshauptmannschaft/i, /magistrat/i, /bezirksamt/i, /stadtamt/i, /gemeindeamt/i, /parkraumüberwachung/i, /\bMA\s?67\b/],
      letters: ['Strafverfügung — a fine, for example for a traffic or parking offence', 'Ladung — you must come in person', 'Bescheid — a decision, for example about a permit or licence'],
      tips: ['Check which department sent the letter. Its phone number is usually at the top.', 'Write the case number (Geschäftszahl or Zahl) on every reply.'],
    },
    {
      id: 'ma35',
      slug: 'ma-35-immigration',
      name: 'Immigration office',
      local: 'MA 35 / Niederlassungsbehörde',
      about: 'Handles residence permits and EU registration certificates. In Vienna this is the MA 35; elsewhere it is the Bezirkshauptmannschaft or the Magistrat.',
      patterns: [/\bMA\s?35\b/, /magistratsabteilung 35/i, /einwanderung und staatsbürgerschaft/i, /aufenthaltstitel/i, /aufenthaltsbewilligung/i, /niederlassungsbewilligung/i, /rot-wei(?:ß|ss)-rot/i, /anmeldebescheinigung/i, /daueraufenthalt/i, /niederlassungs- und aufenthalt/i, /staatsbürgerschaft/i],
      letters: ['Verbesserungsauftrag — fix or complete your application by a deadline', 'Parteiengehör — they plan a decision and let you comment first', 'Aufforderung zur Vorlage von Unterlagen — they need documents', 'Bescheid — the decision on your permit'],
      tips: ['Apply to extend your permit before it ends, but not earlier than 3 months before. If you apply in time, your stay stays legal while they decide.', 'Answer every request (Verbesserungsauftrag, Parteiengehör) before the deadline. If you don’t, they can reject your application.'],
    },
    {
      id: 'meldeamt',
      slug: 'meldeamt',
      name: 'Registration office',
      local: 'Meldeamt / Meldeservice',
      about: 'Registers your address (Meldezettel). You need this registration for many other papers.',
      patterns: [/meldeamt/i, /meldeservice/i, /meldebehörde/i, /meldezettel/i, /meldebestätigung/i, /zentrales melderegister/i, /\bZMR\b/, /meldegesetz/i],
      letters: ['Meldebestätigung — proof of your registered address', 'Aufforderung zur Meldung — you must register or update your address', 'Abmeldung — your registration at an address was ended'],
      tips: ['You must register within 3 days after moving in, and deregister within 3 days before or after moving out.', 'The owner or main tenant of the flat must sign your Meldezettel.'],
    },
    {
      id: 'oegk',
      slug: 'oegk',
      name: 'Health insurance',
      local: 'ÖGK (Österreichische Gesundheitskasse)',
      about: 'The public health insurance for most employees. Your e-card comes from your social insurance.',
      patterns: [/ÖGK/, /\boegk\b/i, /gesundheitskasse/i, /e-card/i, /krankenversicherung/i, /\bBVAEB\b/, /krankengeld/i, /selbstversicherung/i],
      letters: ['Versicherungsbestätigung — proof that you are insured', 'Beitragsvorschreibung — what you must pay, for example for self-insurance', 'Krankengeld — money while you are ill and can’t work'],
      tips: ['Your e-card is your insurance card. Bring it to every doctor’s visit.', 'If you work, your employer must register you. If a letter says you are not insured, contact them quickly.'],
    },
    {
      id: 'svs',
      slug: 'svs',
      name: 'Social insurance for the self-employed',
      local: 'SVS (Sozialversicherung der Selbständigen)',
      about: 'Health, pension and accident insurance for self-employed people and farmers. It sends a bill every quarter.',
      patterns: [/\bSVS\b/, /sozialversicherung der selbständigen/i, /sozialversicherungsanstalt der selbständigen/i, /beitragsvorschreibung/i, /nachbemessung/i, /vorläufige beitragsgrundlage/i],
      letters: ['Beitragsvorschreibung — your quarterly bill', 'Nachbemessung — the final amount after your tax assessment, often a back payment', 'Mahnung — unpaid contributions'],
      tips: ['The first bills are only provisional. After your tax assessment they recalculate (Nachbemessung), which can mean a big back payment. Put money aside.', 'You can ask them to raise your payments now, so the back payment later is smaller.'],
    },
    {
      id: 'pva',
      slug: 'pensionsversicherung',
      name: 'Pension insurance',
      local: 'Pensionsversicherungsanstalt (PVA)',
      about: 'Runs the state pension for most employees. Your insurance months are recorded here.',
      patterns: [/pensionsversicherung/i, /\bPVA\b/, /pensionskonto/i, /versicherungsdatenauszug/i, /pensionsantrag/i],
      letters: ['Pensionskontomitteilung — your pension account statement', 'Versicherungsdatenauszug — a list of your insured months', 'Bescheid — the decision on your pension'],
      tips: ['Check that all your work years are listed. Years in other EU countries can count too, so tell them about them.'],
    },
    {
      id: 'orf',
      slug: 'orf-beitrag',
      name: 'ORF fee office',
      local: 'ORF-Beitrags Service (OBS)',
      about: 'Collects the ORF fee (ORF-Beitrag) for public TV and radio. Every household with a main home in Austria pays it, even without a TV.',
      patterns: [/orf-beitrag/i, /\bOBS\b/, /gebühren info service/i, /\bGIS\b/, /rundfunkgebühr/i],
      letters: ['Zahlungsaufforderung — your fee bill', 'Zahlungserinnerung or Mahnung — you paid late', 'Bescheid — an official decision that you owe the fee'],
      tips: ['Only one payment per household. If someone in your home already pays, tell them.', 'People with low income or some benefits can apply to be exempt (Befreiung).'],
    },
    {
      id: 'polizei',
      slug: 'polizei',
      name: 'Police',
      local: 'Polizei / Landespolizeidirektion',
      about: 'The police. In some places, such as Vienna, the Landespolizeidirektion also handles traffic fines.',
      patterns: [/polizei/i, /\bLPD\b/, /verkehrsamt/i, /strafamt/i],
      letters: ['Strafverfügung — a fine; you can object (Einspruch) within 2 weeks', 'Anonymverfügung — a fine for the car owner; pay it in time', 'Lenkererhebung — you must say who was driving', 'Ladung — you must come to the police station'],
      tips: ['If they ask who drove your car, you must answer within 2 weeks — even if it was you.', 'For an Anonymverfügung, pay with the payment slip or the exact reference. Otherwise your payment may not be matched.'],
    },
    {
      id: 'gericht',
      slug: 'gericht',
      name: 'Court',
      local: 'Gericht (Bezirksgericht)',
      about: 'A court. Letters from a court are always important — never ignore them.',
      patterns: [/bezirksgericht/i, /landesgericht/i, /arbeits- und sozialgericht/i, /verwaltungsgericht/i, /bundesfinanzgericht/i, /handelsgericht/i, /zahlungsbefehl/i, /gerichtsvollzieher/i],
      letters: ['Zahlungsbefehl — a court order to pay; object (Einspruch) in time if you don’t owe it', 'Exekutionsbewilligung — the court allows a creditor to take money from you', 'Ladung — you must appear in court'],
      tips: ['Court deadlines are strict and short. Get advice quickly.', 'Many district courts give free legal information on fixed days (Amtstag).'],
    },
    {
      id: 'inkasso',
      slug: 'inkasso',
      name: 'Debt collection agency',
      local: 'Inkassobüro',
      about: 'A company that collects money for someone else. Check if the debt is real before paying.',
      patterns: [/inkasso/i, /forderungsmanagement/i],
      letters: ['Zahlungsaufforderung — they ask you to pay a debt plus fees', 'Ratenvereinbarung — an offer to pay in instalments'],
      tips: ['Ask for proof of the original debt if you don’t recognise it.', 'Don’t sign a statement that you owe the money (Schuldanerkenntnis) before a debt advice service has checked it.'],
    },
    {
      id: 'vermieter',
      slug: 'vermieter',
      name: 'Landlord or property manager',
      local: 'Vermieter / Hausverwaltung',
      about: 'The owner of your flat or the company that manages it.',
      patterns: [/hausverwaltung/i, /\bvermieter/i, /mietvertrag/i, /\bmieter\b/i, /mietzins/i, /betriebskostenabrechnung/i, /wiener wohnen/i, /wohnungseigentum/i],
      letters: ['Betriebskostenabrechnung — the yearly bill for shared building costs', 'Mietzinsvorschreibung — your rent bill', 'Kündigung — notice to end your rental contract'],
      tips: ['You can ask to see the receipts for the shared costs (Belegeinsicht). A tenants’ association can check the bill.', 'In many flats the landlord can only end the rental contract through a court and for a reason allowed by law. Get advice quickly.'],
    },
    {
      id: 'versorger',
      slug: 'energieversorger',
      name: 'Energy supplier',
      local: 'Energieversorger',
      about: 'The company that sells you electricity, gas or district heating.',
      patterns: [/wien energie/i, /wiener netze/i, /\bEVN\b/, /verbund ag/i, /energie steiermark/i, /salzburg ag/i, /linz ag/i, /\bkelag\b/i, /\btiwag\b/i, /energie ag/i, /illwerke vkw/i, /fernwärme/i, /stromlieferung/i, /gaslieferung/i, /teilbetrag/i, /zählerstand/i, /\bkWh\b/],
      letters: ['Jahresabrechnung — the yearly bill', 'Teilbetragsvorschreibung — your regular part payment changes', 'Mahnung — a reminder; a later one may warn that they will cut off supply (Abschaltung)'],
      tips: ['If they warn they will cut off supply, call them right away and ask for a payment plan.', 'Households have a right to basic supply (Grundversorgung), even with debts. They may ask for a deposit or a prepayment meter.'],
    },
    {
      id: 'sozialamt',
      slug: 'sozialhilfe',
      name: 'Social aid office',
      local: 'Sozialamt / MA 40',
      about: 'Pays basic support to live on (Sozialhilfe; in Vienna: Mindestsicherung) if your income is too low.',
      patterns: [/\bMA\s?40\b/, /sozialamt/i, /sozialhilfe/i, /mindestsicherung/i, /sozialzentrum/i],
      letters: ['Bescheid — how much support you get, or a rejection', 'Aufforderung zur Vorlage von Unterlagen — they need proof of your income and costs'],
      tips: ['Tell them at once if your income, rent or household changes. Otherwise you may have to pay money back.'],
    },
  ],
  kinds: [
    {
      id: 'exekution', type: 'enforcement', local: 'Exekution', name: 'Enforcement notice', about: 'They are about to take money or things from you by force, for example part of your wages or money in your bank account.', urgency: 'high', extendable: false, patterns: [/exekution/i, /pfändung/i, /pfaendung/i, /gerichtsvollzieher/i, /vollstreckung/i],
      steps: ['If you think the enforcement is wrong, get advice the same day. The deadline to object is very short — check the letter.'],
    },
    {
      id: 'zahlungsbefehl', type: 'court-order', local: 'Zahlungsbefehl', name: 'Court payment order', about: 'A court order to pay. If you don’t owe the money, you must object (Einspruch) in time — usually within 4 weeks. If you ignore it, they can take the money by force (Exekution).', urgency: 'high', extendable: false, patterns: [/zahlungsbefehl/i, /mahnklage/i],
      steps: ['If you really owe this money, pay it, including the costs on the order.', 'If you don’t owe it, send an objection (Einspruch) to the court before the deadline in the letter. Get advice first, for example on a free court advice day (Amtstag).'],
    },
    { id: 'rueckforderung', type: 'repayment', local: 'Rückforderung', name: 'Request to pay money back', about: 'They think they paid you too much and want the money back.', urgency: 'high', patterns: [/rückforderung/i, /rueckforderung/i, /überbezug/i, /zu unrecht bezogen/i, /zurückzuzahlen/i, /rückzuerstatten/i] },
    {
      id: 'strafverfuegung', type: 'fine', local: 'Strafverfügung', name: 'Fine', about: 'A fine from the police or the district authority, for example for speeding. You can object (Einspruch) within 2 weeks after delivery.', urgency: 'high', extendable: false, patterns: [/(?:^|[^n])strafverf(?:ü|ue)gung/i],
      steps: ['If you accept the fine, pay it. If you think it’s wrong — or only that the amount is too high — send an objection (Einspruch) in writing within 2 weeks after delivery.'],
    },
    {
      id: 'anonymverfuegung', type: 'fine', instalments: false, local: 'Anonymverfügung / Organmandat', name: 'Quick fine', about: 'A quick fine, often for speeding or parking. You can’t object to it. If you pay the exact amount in time, the matter is closed. If you don’t, a normal procedure starts, which can cost more.', urgency: 'high', objection: false, extendable: false, patterns: [/anonymverf(?:ü|ue)gung/i, /organstrafverf(?:ü|ue)gung/i, /organmandat/i],
      steps: ['Pay the exact amount in time, with the payment slip or the exact reference (Identifikationsnummer). For an Anonymverfügung you usually have 4 weeks from the date on the letter — not from the day you got it. For an Organmandat it is usually 2 weeks.','If you think the fine is wrong, don’t pay it. A normal procedure then starts, and you can object to the next letter (usually a Strafverfügung).'],
    },
    { id: 'mahnung', type: 'reminder', local: 'Mahnung / Zahlungserinnerung', name: 'Payment reminder', about: 'You have not paid something on time. Extra fees (Mahnspesen) or interest may be added if you wait longer.', urgency: 'high', patterns: [/mahnung/i, /zahlungserinnerung/i, /zahlungsaufforderung/i, /säumniszuschl[aä]g/i, /mahnspesen/i, /mahngebühr/i, /zahlungsrückstand/i, /rückstand/i, /offene forderung/i, /offener betrag/i, /noch nicht (?:bezahlt|beglichen|eingelangt)/i] },
    { id: 'termin', type: 'appointment', local: 'Einladung / Ladung', name: 'Appointment', about: 'They want you to come to an appointment. Missing it without a good reason can have consequences, for example the AMS can stop your payments.', urgency: 'medium', patterns: [/einladung/i, /\bladung\b/i, /vorladung/i, /ladungsbescheid/i, /kontrollmeldung/i, /kontrolltermin/i, /beratungstermin/i, /laden wir sie/i, /persönlich (?:zu )?erscheinen/i, /persönlich vorzusprechen/i, /zu einem (?:beratungs)?gespräch/i] },
    { id: 'unterlagen', type: 'documents', local: 'Aufforderung / Unterlagen', name: 'Request for documents or information', about: 'They need papers, information or a statement from you before they can decide. If you don’t answer in time, they can decide without you or reject your application.', urgency: 'medium', patterns: [/verbesserungsauftrag/i, /mängelbehebung/i, /ergänzungsersuchen/i, /\bvorhalt\b/i, /fehlende unterlagen/i, /folgende unterlagen/i, /unterlagen[^.\n]{0,60}(?:vorzulegen|nachzureichen|zu übermitteln|einzureichen)/i, /bitte (?:übermitteln|senden|schicken) sie uns/i, /benötigen wir/i, /mitwirkung/i, /überprüfung des anspruchs/i, /lenkererhebung/i, /lenkerauskunft/i, /bekanntgabe des lenkers/i, /parteiengehör/i, /ergebnis der beweisaufnahme/i] },
    { id: 'ablehnung', type: 'rejection', local: 'Abweisung / Ablehnung', name: 'Rejection', about: 'Your application was turned down. You can usually object (Beschwerde) if you think this is wrong.', urgency: 'medium', patterns: [/abgewiesen/i, /abweisung/i, /abgelehnt/i, /ablehnung/i, /zurückgewiesen/i, /kann nicht (?:entsprochen|stattgegeben) werden/i, /keinen anspruch/i] },
    {
      id: 'steuerbescheid', type: 'tax-assessment', local: 'Einkommensteuerbescheid', name: 'Tax assessment', about: 'The result of your tax return. It shows whether you pay more tax (Nachforderung) or get money back (Gutschrift).', urgency: 'medium', extendable: false, patterns: [/einkommensteuerbescheid/i, /einkommensteuer/i, /arbeitnehmerveranlagung/i, /umsatzsteuerbescheid/i, /abgabennachforderung/i, /abgabengutschrift/i, /steuerbescheid/i],
      steps: ['Check the amounts against your tax return. If something is wrong, you can object (Beschwerde) within one month — also online in FinanzOnline.', 'Objecting doesn’t delay the payment. If you object and don’t want to pay the disputed part yet, ask for a pause (Aussetzung der Einhebung) at the same time.'],
    },
    { id: 'bewilligung', type: 'approval', local: 'Zuerkennung / Bewilligung', name: 'Approval', about: 'Your application was approved. The letter shows how much you get and for how long.', urgency: 'low', patterns: [/zuerkannt/i, /zuerkennung/i, /bewilligt/i, /stattgegeben/i, /gewährt/i, /mitteilung über den leistungsanspruch/i, /mitteilung über den bezug/i] },
    {
      id: 'kuendigung', type: 'termination', local: 'Kündigung', name: 'Termination notice', about: 'A contract is being ended, for example your flat, your job or a subscription.', urgency: 'high', patterns: [/kündigung/i, /kuendigung/i, /kündigen wir/i, /gekündigt/i],
      steps: ['If this is about your job, contact the Arbeiterkammer right away. Some deadlines to fight a dismissal are very short (sometimes only 2 weeks).'],
    },
    {
      id: 'betriebskosten', type: 'utility-bill', local: 'Betriebskostenabrechnung', name: 'Yearly bill for building costs', about: 'Your landlord’s yearly bill for shared building costs, like water, rubbish, cleaning and insurance. You may have to pay extra or get money back.', urgency: 'medium', patterns: [/betriebskostenabrechnung/i, /betriebskosten/i, /heizkostenabrechnung/i, /nebenkostenabrechnung/i],
      steps: ['Check the bill carefully. You can ask to see the receipts (Belegeinsicht). A tenants’ association can check it for you.'],
    },
    {
      id: 'hinterlegung', type: 'court-order', local: 'Hinterlegungsanzeige', name: 'Letter waiting at the post office', about: 'You were not home when an official letter (RSa or RSb) came, so it is waiting for you at the post office. It usually counts as delivered on the first day you can pick it up, and deadlines start then — even if you collect it later.', urgency: 'high', patterns: [/hinterlegung/i, /hinterlegt/i, /abholfrist/i, /zur abholung bereitgehalten/i],
      steps: ['Pick up the letter as soon as you can at the post office or post partner named on the slip. Bring the slip and your photo ID.', 'If you were away and couldn’t know about the letter, tell the office right away. The deadline may then start later.'],
    },
    { id: 'rechnung', type: 'bill', local: 'Rechnung / Vorschreibung', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\brechnung\b/i, /rechnungsbetrag/i, /jahresabrechnung/i, /teilbetrag/i, /vorschreibung/i] },
    { id: 'bescheid', type: 'decision', local: 'Bescheid', name: 'Official decision', about: 'A formal decision by an authority. It becomes final unless you object in time, usually with a Beschwerde.', urgency: 'medium', weight: 0.4, patterns: [/bescheid/i, /straferkenntnis/i] },
  ],
  references: [
    { name: 'Case number', local: 'Geschäftszahl', pattern: /(?:geschäftszahl|geschaeftszahl|\bgz\b\.?|\bzahl\s*:)/gi },
    { name: 'Case number', local: 'Aktenzeichen', pattern: /(?:aktenzeichen|aktenzahl|\baz\b\.?|unser zeichen)/gi },
    { name: 'Tax number', local: 'Steuernummer', pattern: /(?:steuernummer|st\.-?nr\.?)/gi },
    { name: 'Social insurance number', local: 'Sozialversicherungsnummer', personal: true, pattern: /(?:sozialversicherungsnummer|versicherungsnummer|sv-nummer|sv-nr\.?|\bvsnr\.?)/gi },
    { name: 'Customer number', local: 'Kundennummer', pattern: /(?:kundennummer|kunden-nr\.?|kundennr\.?)/gi },
    { name: 'Contribution number', local: 'Beitragsnummer', pattern: /beitragsnummer/gi },
    { name: 'Subscriber number', local: 'Teilnehmernummer', pattern: /(?:teilnehmernummer|teilnehmer-nr\.?)/gi },
    { name: 'Payment reference', local: 'Zahlungsreferenz', payment: true, pattern: /(?:zahlungsreferenz|verwendungszweck)/gi },
    { name: 'Payment ID', local: 'Identifikationsnummer', payment: true, pattern: /identifikationsnummer/gi },
    { name: 'Invoice number', local: 'Rechnungsnummer', pattern: /(?:rechnungsnummer|rechnungs-nr\.?|rechnungsnr\.?)/gi },
    { name: 'Contract number', local: 'Vertragsnummer', pattern: /(?:vertragsnummer|vertrags-nr\.?|vertragskonto(?:nummer)?)/gi },
  ],
  glossary: [
    { term: 'Bescheid', slug: 'bescheid', pattern: /bescheid/i, meaning: 'Official decision. It becomes final if you don’t object in time.', tip: 'Read the end of the letter (Rechtsmittelbelehrung). It says how long you have to object — often 4 weeks or one month.' },
    { term: 'Beschwerde', slug: 'beschwerde', pattern: /beschwerde/i, meaning: 'Objection to an official decision (Bescheid). Usually within 4 weeks; for tax decisions within one month.', tip: 'Send it in writing to the office that made the decision. Say which decision you mean, why it is wrong and what you want.' },
    { term: 'Einspruch', slug: 'einspruch', pattern: /einspruch/i, meaning: 'Objection, for example to a fine (Strafverfügung, within 2 weeks) or to a court payment order (Zahlungsbefehl).' },
    { term: 'Vorstellung', slug: 'vorstellung', pattern: /\bvorstellung\b/i, meaning: 'Objection to a quick decision (Mandatsbescheid) that was made without hearing you first. Usually within 2 weeks.' },
    { term: 'Mandatsbescheid', slug: 'mandatsbescheid', pattern: /mandatsbescheid/i, meaning: 'Quick decision made without hearing you first. You can object (Vorstellung) within 2 weeks.' },
    { term: 'Rechtsmittelbelehrung', slug: 'rechtsmittelbelehrung', pattern: /rechtsmittelbelehrung|rechtsbehelfsbelehrung/i, meaning: 'The part at the end that explains how and by when you can object.' },
    { term: 'Frist', slug: 'frist', pattern: /\bfrist/i, meaning: 'Deadline.', tip: 'Deadlines set by law often can’t be extended. If you need more time, ask early (Fristerstreckung).' },
    { term: 'Zustellung', slug: 'zustellung', pattern: /zustellung|zugestellt/i, meaning: 'Formal delivery of a letter. Most deadlines start on the day of delivery.' },
    { term: 'Hinterlegung', slug: 'hinterlegung', pattern: /hinterleg/i, meaning: 'The post office keeps an official letter for you because you were not home. You get a notice slip.', tip: 'The letter usually counts as delivered on the first day you can pick it up — even if you collect it later.' },
    { term: 'RSa / RSb', slug: 'rsa-rsb', pattern: /\bRS[ab]\b|rückschein/i, meaning: 'Registered official letter that you must sign for. An RSa letter is only given to you; an RSb letter can also be given to another adult at your address.', tip: 'Pick it up quickly. Deadlines can start before you collect it.' },
    { term: 'Jänner', slug: 'jaenner', pattern: /jänner/i, meaning: 'January (the Austrian word).' },
    { term: 'Feber', slug: 'feber', pattern: /\bfeber\b/i, meaning: 'February (an Austrian word).' },
    { term: 'Meldezettel', slug: 'meldezettel', pattern: /meldezettel/i, meaning: 'Form to register your address. You must register within 3 days after moving in.', tip: 'Keep your proof of registration (Meldebestätigung). Banks, schools and offices often ask for it.' },
    { term: 'Hauptwohnsitz', slug: 'hauptwohnsitz', pattern: /hauptwohnsitz/i, meaning: 'Your main home — the place where you mainly live.' },
    { term: 'e-card', slug: 'e-card', pattern: /e-card/i, meaning: 'Your health insurance card. Bring it to every doctor’s visit.' },
    { term: 'Sozialversicherungsnummer', slug: 'sozialversicherungsnummer', pattern: /sozialversicherungsnummer|sv-nummer/i, meaning: 'Your 10-digit social insurance number. It is on your e-card.' },
    { term: 'Exekution', slug: 'exekution', pattern: /exekution/i, meaning: 'Enforcement. A creditor takes money or things from you with official permission, for example part of your wages.', tip: 'Act the same day: pay, or call and ask for a payment plan. A debt advice service (Schuldenberatung) helps for free.' },
    { term: 'Pfändung', slug: 'pfaendung', pattern: /pfändung|gepfändet/i, meaning: 'Seizure of money or things to pay a debt. A basic amount to live on (Existenzminimum) stays protected.' },
    { term: 'Zahlungsbefehl', slug: 'zahlungsbefehl', pattern: /zahlungsbefehl/i, meaning: 'Court order to pay. If you don’t owe the money, object (Einspruch) in time — usually within 4 weeks.', tip: 'If you do nothing, it becomes final and they can take the money by force.' },
    { term: 'Strafverfügung', slug: 'strafverfuegung', pattern: /(?:^|[^n])strafverfügung/i, meaning: 'Fine from the police or district authority. You can object (Einspruch) within 2 weeks after delivery.', tip: 'If you object, explain what happened and add proof if you have it.' },
    { term: 'Anonymverfügung', slug: 'anonymverfuegung', pattern: /anonymverfügung/i, meaning: 'Fine sent to the car owner when the driver is not known. You can’t object to it.', tip: 'Pay in time with the payment slip or the exact reference. If you don’t pay, a normal procedure starts.' },
    { term: 'Organmandat', slug: 'organmandat', pattern: /organmandat|organstrafverfügung/i, meaning: 'Small on-the-spot fine, for example from the police or a parking warden.' },
    { term: 'Straferkenntnis', slug: 'straferkenntnis', pattern: /straferkenntnis/i, meaning: 'Fine decision after a full procedure. You can object (Beschwerde) within 4 weeks.' },
    { term: 'Verwaltungsübertretung', slug: 'verwaltungsuebertretung', pattern: /verwaltungsübertretung/i, meaning: 'A minor offence, for example a traffic or parking offence. It is not a crime.' },
    { term: 'Lenkerauskunft', slug: 'lenkerauskunft', pattern: /lenkerauskunft|lenkererhebung|bekanntgabe des lenkers/i, meaning: 'Request to the car owner to say who was driving.', tip: 'You must answer within 2 weeks, even if you were the driver. Not answering is a separate offence.' },
    { term: 'Säumniszuschlag', slug: 'saeumniszuschlag', pattern: /säumniszuschl[aä]g/i, meaning: 'Late payment charge, for example when you pay tax too late.' },
    { term: 'Mahnspesen', slug: 'mahnspesen', pattern: /mahnspesen|mahngebühr/i, meaning: 'Fee added for a payment reminder.' },
    { term: 'Stundung', slug: 'stundung', pattern: /stundung/i, meaning: 'Permission to pay later.' },
    { term: 'Ratenzahlung', slug: 'ratenzahlung', pattern: /ratenzahlung|teilzahlung|in raten/i, meaning: 'Paying in instalments.' },
    { term: 'Zahlungserleichterung', slug: 'zahlungserleichterung', pattern: /zahlungserleichterung/i, meaning: 'Request to pay later or in instalments, for example at the tax office. Ask before the due date.' },
    { term: 'Fälligkeitstag', slug: 'faelligkeitstag', pattern: /fälligkeit|fällig/i, meaning: 'Due date. Pay by this day.' },
    { term: 'Abgabennachforderung', slug: 'abgabennachforderung', pattern: /nachforderung/i, meaning: 'Extra tax to pay. You paid less than you owe.' },
    { term: 'Gutschrift', slug: 'gutschrift', pattern: /gutschrift/i, meaning: 'Credit. Money you get back or that is added to your account.' },
    { term: 'Aussetzung der Einhebung', slug: 'aussetzung-der-einhebung', pattern: /aussetzung der einhebung/i, meaning: 'A pause in collecting a disputed tax until your objection is decided. If you lose, interest may be added.' },
    { term: 'Arbeitnehmerveranlagung', slug: 'arbeitnehmerveranlagung', pattern: /arbeitnehmerveranlagung/i, meaning: 'Yearly tax return for employees. Many people get money back, and you can file it up to 5 years later.' },
    { term: 'FinanzOnline', slug: 'finanzonline', pattern: /finanzonline/i, meaning: 'The tax office’s online portal. Letters can arrive in its Databox instead of by post.' },
    { term: 'Familienbeihilfe', slug: 'familienbeihilfe', pattern: /familienbeihilfe/i, meaning: 'Monthly child benefit, paid by the tax office (Finanzamt Österreich).' },
    { term: 'Arbeitslosengeld', slug: 'arbeitslosengeld', pattern: /arbeitslosengeld/i, meaning: 'Unemployment benefit from the AMS.' },
    { term: 'Notstandshilfe', slug: 'notstandshilfe', pattern: /notstandshilfe/i, meaning: 'Support from the AMS after your unemployment benefit ends, if you still need it.' },
    { term: 'Sozialhilfe / Mindestsicherung', slug: 'sozialhilfe', pattern: /sozialhilfe|mindestsicherung/i, meaning: 'Basic support to live on if your income is too low. It is paid by your province; in Vienna it is called Mindestsicherung.' },
    { term: 'Kontrollmeldung', slug: 'kontrollmeldung', pattern: /kontrollmeldung|kontrolltermin/i, meaning: 'Required appointment at the AMS.', tip: 'If you miss it without a good reason, your payments can stop until you contact them again.' },
    { term: 'Aufenthaltstitel', slug: 'aufenthaltstitel', pattern: /aufenthaltstitel/i, meaning: 'Residence permit.' },
    { term: 'Rot-Weiß-Rot-Karte', slug: 'rot-weiss-rot-karte', pattern: /rot-wei(?:ß|ss)-rot/i, meaning: 'Residence and work permit for skilled workers from outside the EU.' },
    { term: 'Anmeldebescheinigung', slug: 'anmeldebescheinigung', pattern: /anmeldebescheinigung/i, meaning: 'Registration certificate for EU citizens who stay longer than 3 months. Apply within 4 months after you arrive.' },
    { term: 'Verbesserungsauftrag', slug: 'verbesserungsauftrag', pattern: /verbesserungsauftrag|mängelbehebung/i, meaning: 'Request to fix or complete your application by a deadline. If you don’t, they can reject it.' },
    { term: 'Parteiengehör', slug: 'parteiengehoer', pattern: /parteiengehör|ergebnis der beweisaufnahme/i, meaning: 'Your right to see the evidence and comment before they decide.' },
    { term: 'ORF-Beitrag', slug: 'orf-beitrag', pattern: /orf-beitrag/i, meaning: 'Fee for public TV and radio. One payment per household with a main home in Austria, even without a TV.' },
    { term: 'Betriebskosten', slug: 'betriebskosten', pattern: /betriebskosten/i, meaning: 'Shared building costs on top of the rent, like water, rubbish and cleaning.' },
    { term: 'Schuldanerkenntnis', slug: 'schuldanerkenntnis', pattern: /anerkenntnis/i, meaning: 'A signed statement that you owe the money. Don’t sign it before you have checked the debt.' },
  ],
  replies: {
    objection: {
      subject: (term, of) => `${term} gegen ${objectOf(term)} ${of}`,
      body: (term, of) => [
        `gegen ${objectOf(term)} ${of} erhebe ich innerhalb offener Frist ${term}.`,
        '',
        'Ich beantrage, [die Entscheidung aufzuheben / die Strafe herabzusetzen / den Betrag neu zu berechnen].',
        '',
        'Begründung: [Erklären Sie in wenigen Sätzen, warum die Entscheidung falsch ist. Legen Sie Nachweise bei, wenn Sie welche haben.]',
        '',
        'Bitte bestätigen Sie mir den Eingang dieses Schreibens.',
      ],
    },
    moreTime: {
      name: 'Fristerstreckung',
      subject: 'Ansuchen um Fristerstreckung',
      body: (of, deadline) => [
        `in Ihrem Schreiben ${of} haben Sie mir eine Frist bis ${deadline ?? '[Datum]'} gesetzt.`,
        'Leider kann ich diese Frist nicht einhalten, weil [Grund, zum Beispiel: mir noch Unterlagen fehlen / ich krank bin].',
        '',
        'Ich ersuche Sie daher, die Frist bis [neues Datum] zu erstrecken.',
        '',
        'Vielen Dank für Ihr Verständnis.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'suspend-payment',
      title: 'Ask to pause the payment while you object (Aussetzung der Einhebung)',
      advice: 'Use this together with your objection (Beschwerde) if you don’t want to pay the disputed tax yet. Only ask for the part you disagree with. If you lose, you may have to pay interest.',
      english: 'I have objected to your tax decision. I ask you to pause the collection of the disputed amount of [amount] until my objection is decided.',
      subject: 'Antrag auf Aussetzung der Einhebung',
      body: (result) => [
        `gegen den Bescheid ${result.letterDate ? `vom ${local(result.letterDate)}` : 'vom [TT.MM.JJJJ]'} habe ich Beschwerde erhoben.`,
        `Ich beantrage die Aussetzung der Einhebung von ${result.money.toPay ? euro(result.money.toPay.amount) : '[Betrag]'} [oder nur des Teils, mit dem Sie nicht einverstanden sind], bis über meine Beschwerde entschieden ist.`,
        '',
        'Bitte bestätigen Sie mir den Eingang dieses Antrags.',
      ],
      when: (result) => result.kind?.type === 'tax-assessment' && Boolean(result.money.toPay),
    },
    {
      id: 'more-time-objection',
      title: 'Ask for more time to object (Verlängerung der Beschwerdefrist)',
      advice: 'Use this if you need more time to prepare your objection (Beschwerde) to a tax decision. Send it before the one-month deadline ends and give a reason.',
      english: 'I need more time to prepare my objection to your tax decision because [reason]. Please extend the deadline until [new date].',
      subject: 'Antrag auf Verlängerung der Beschwerdefrist',
      body: (result) => [
        `ich beantrage, die Frist für eine Beschwerde gegen den Bescheid ${result.letterDate ? `vom ${local(result.letterDate)}` : 'vom [TT.MM.JJJJ]'} bis [neues Datum] zu verlängern.`,
        '',
        'Begründung: [Grund, zum Beispiel: Ich brauche noch Unterlagen von meinem Arbeitgeber / Ich lasse mich noch beraten.]',
        '',
        'Bitte bestätigen Sie mir den Eingang dieses Antrags.',
      ],
      when: (result) => result.kind?.type === 'tax-assessment',
    },
  ],
  samples: [
    {
      id: 'tax',
      title: 'Tax office',
      subtitle: 'Tax assessment with a payment',
      build(today) {
        const letter = addDays(today, -3);
        const year = Number(today.slice(0, 4)) - 1;
        const due = nextWorkday(addDays(letter, 35));
        return `Finanzamt Österreich
Postfach 123 · 1000 Wien
www.bmf.gv.at

Herrn
Lukas Beispiel
Musterweg 7/12
1030 Wien

Steuernummer: 03 123/4567
Datum: ${local(letter)}

Einkommensteuerbescheid ${year}

Die Einkommensteuer für das Jahr ${year} wird festgesetzt mit: 638,00 €
Bisher war vorgeschrieben: 0,00 €
Abgabennachforderung: 638,00 €

Fälligkeitstag: ${local(due)}

Bitte zahlen Sie den Gesamtbetrag von 638,00 € bis zum Fälligkeitstag auf folgendes Konto:
Empfänger: Finanzamt Österreich
IBAN: AT61 1904 3002 3457 3201
BIC: BEISATWWXXX
Zahlungsreferenz: 031234567 E ${year}

Wenn Sie den Betrag nicht rechtzeitig zahlen, kann ein Säumniszuschlag festgesetzt werden.

Begründung
Bei der Berechnung wurden die Bezüge laut Lohnzettel Ihres Arbeitgebers berücksichtigt. Die Werbungskosten wurden in der beantragten Höhe anerkannt.

Rechtsmittelbelehrung
Gegen diesen Bescheid kann innerhalb eines Monats nach Zustellung das Rechtsmittel der Beschwerde eingebracht werden. Die Beschwerde ist beim Finanzamt Österreich schriftlich oder über FinanzOnline einzubringen. Die Beschwerde hat keine aufschiebende Wirkung: Der Betrag ist trotzdem bis zum Fälligkeitstag zu zahlen.

Finanzamt Österreich`;
      },
    },
    {
      id: 'fine',
      title: 'Police',
      subtitle: 'Speeding fine (Strafverfügung)',
      build(today) {
        const letter = addDays(today, -5);
        const offence = addDays(today, -41);
        return `Landespolizeidirektion Wien
Referat Verwaltungsstrafen
Postfach 456 · 1010 Wien

Frau
Ana Beispiel
Lindengasse 5/3
1070 Wien

GZ: VStV/926001234567/2026
Wien, ${local(letter)}

STRAFVERFÜGUNG

Sie haben folgende Verwaltungsübertretung begangen:
Tatzeit: ${local(offence)}, 14:35
Tatort: Wien 10, Triester Straße 120, stadtauswärts
Fahrzeug: Pkw, Kennzeichen W-12345X

Sie haben die im Ortsgebiet erlaubte Höchstgeschwindigkeit von 50 km/h um 23 km/h überschritten. Die Messtoleranz wurde bereits abgezogen.

Verletzte Rechtsvorschrift: § 20 Abs. 2 StVO

Wegen dieser Verwaltungsübertretung wird über Sie folgende Strafe verhängt:
Geldstrafe: € 110,00
Ersatzfreiheitsstrafe: 2 Tage
Zu zahlender Gesamtbetrag: € 110,00

Wenn Sie keinen Einspruch erheben, wird diese Strafverfügung rechtskräftig. Bitte zahlen Sie den Gesamtbetrag dann mit dem beiliegenden Zahlschein oder auf folgendes Konto:
Empfänger: Landespolizeidirektion Wien
IBAN: AT61 1904 3002 3457 3201
Zahlungsreferenz: VStV/926001234567/2026

Rechtsmittelbelehrung
Sie haben das Recht, gegen diese Strafverfügung binnen zwei Wochen nach Zustellung schriftlich, per E-Mail oder mündlich bei der Landespolizeidirektion Wien Einspruch zu erheben. Wenn Sie nur gegen die Höhe der Strafe Einspruch erheben, entscheidet die Behörde nur über die Höhe.

Für die Landespolizeidirektion Wien
M. Huber`;
      },
    },
  ],
};
