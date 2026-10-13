import { addDays, addMonths, formatGermanDate, fromIso } from '../dates.js';

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function quarterBefore(iso) {
  const [year, month] = iso.split('-').map(Number);
  const startMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const start = addMonths(`${year}-${String(startMonth).padStart(2, '0')}-01`, -3);
  return { start, end: addDays(addMonths(start, 3), -1) };
}

export default {
  id: 'de',
  slug: 'germany',
  name: 'Germany',
  adjective: 'German',
  flag: '🇩🇪',
  language: 'de',
  currency: 'EUR',
  decimal: ',',
  thousands: '.',
  dateSeparator: '.',
  ibanLength: 22,
  intro: 'German offices write formal letters with strict deadlines. Most decisions (Bescheid) become final after one month unless you object in writing.',
  signals: [/\bDeutschland\b/i, /\.de\b/i, /\bDE\d{2}\s?\d{4}/, /ß/, /\bjobcenter\b/i, /rundfunkbeitrag/i, /\bbürgergeld\b/i, /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/],
  deliveryDays: 4,
  deliveryNote: 'In Germany, a posted official letter usually counts as delivered on the 4th day after it was sent.',
  objectionAdvice: 'Use this if you think the decision is wrong. Send it before the deadline, on paper and signed. You can send the reasons later.',
  objection: [
    { word: 'Einspruch', pattern: /einspruch/i },
    { word: 'Widerspruch', pattern: /widerspruch/i },
  ],
  help: {
    debt: 'a free debt advice centre (Schuldnerberatung), for example at Caritas, Diakonie or your city',
    tenant: 'a tenants’ association (Mieterverein)',
    instalments: 'Ratenzahlung',
    general: 'a free advice centre such as the Verbraucherzentrale or a migration advice service (Migrationsberatung)',
  },
  senders: [
    {
      id: 'finanzamt',
      slug: 'finanzamt',
      name: 'Tax office',
      local: 'Finanzamt',
      about: 'Handles your income tax and other taxes.',
      patterns: [/finanzamt/i, /bundeszentralamt für steuern/i, /steuerbescheid/i, /einkommensteuer/i],
      letters: ['Steuerbescheid — the result of your tax return', 'Aufforderung zur Abgabe der Steuererklärung — a reminder to file your tax return', 'Mahnung or Säumniszuschlag — you paid tax late'],
      tips: ['You can object (Einspruch) within one month after the letter counts as delivered.', 'Your tax number (Steuernummer) is on every letter. Use it whenever you contact them.'],
    },
    {
      id: 'hauptzollamt',
      slug: 'hauptzollamt',
      name: 'Customs office',
      local: 'Hauptzollamt',
      about: 'Collects some federal taxes, for example the car tax (Kfz-Steuer), and collects debts for other federal offices.',
      patterns: [/hauptzollamt/i, /kraftfahrzeugsteuer/i, /kfz-steuer/i],
      letters: ['Kfz-Steuerbescheid — your yearly car tax', 'Vollstreckungsankündigung — they will collect an unpaid debt by force'],
      tips: ['The customs office often collects debts for other offices too. Check which office the debt is from.'],
    },
    {
      id: 'jobcenter',
      slug: 'jobcenter',
      name: 'Jobcenter',
      local: 'Jobcenter',
      about: 'Pays citizen’s income (Bürgergeld) to people who can work but don’t earn enough to live on.',
      patterns: [/jobcenter/i, /bürgergeld/i, /buergergeld/i, /bedarfsgemeinschaft/i],
      letters: ['Einladung zum Meldetermin — a required appointment', 'Bewilligungsbescheid — how much Bürgergeld you get', 'Aufforderung zur Mitwirkung — they need documents from you', 'Aufhebungs- und Erstattungsbescheid — they want money back'],
      tips: ['Missing an appointment without a good reason can reduce your money. If you are ill, send a doctor’s note.', 'Always write your BG-Nummer on what you send them, and keep copies.'],
    },
    {
      id: 'arbeitsagentur',
      slug: 'agentur-fuer-arbeit',
      name: 'Employment agency',
      local: 'Agentur für Arbeit',
      about: 'Pays unemployment benefit (Arbeitslosengeld) and helps you find work.',
      patterns: [/agentur für arbeit/i, /bundesagentur für arbeit/i, /arbeitslosengeld/i],
      letters: ['Bewilligungsbescheid über Arbeitslosengeld — your unemployment benefit', 'Einladung — an appointment with your adviser', 'Sperrzeit — a pause in payments, for example after quitting a job'],
      tips: ['Register as a job seeker at least 3 months before your job ends, or within 3 days if you find out later.'],
    },
    {
      id: 'auslaenderbehoerde',
      slug: 'auslaenderbehoerde',
      name: 'Immigration office',
      local: 'Ausländerbehörde',
      about: 'Handles visas and residence permits for people who are not German or EU citizens.',
      patterns: [/ausländerbehörde/i, /auslaenderbehoerde/i, /ausländeramt/i, /landesamt für einwanderung/i, /einwanderungsbehörde/i, /amt für migration/i, /aufenthaltstitel/i, /aufenthaltserlaubnis/i, /fiktionsbescheinigung/i],
      letters: ['Termin zur Vorsprache — an appointment to apply for or extend your permit', 'Anhörung — they plan a decision about your stay and let you explain first', 'Fiktionsbescheinigung — a paper that keeps you legal while they decide'],
      tips: ['Apply to extend your permit before it ends. Your stay stays legal while they decide.', 'Answer hearing letters (Anhörung) in time — it can change the decision.'],
    },
    {
      id: 'buergeramt',
      slug: 'buergeramt',
      name: 'Citizens’ office',
      local: 'Bürgeramt',
      about: 'Handles address registration (Anmeldung), ID cards and passports.',
      patterns: [/bürgeramt/i, /buergeramt/i, /bürgerbüro/i, /einwohnermeldeamt/i, /meldebehörde/i, /bürgerservice/i],
      letters: ['Anmeldebestätigung — proof of your registered address', 'Aufforderung zur Anmeldung — you must register your address'],
      tips: ['You must register a new address within 2 weeks of moving in.'],
    },
    {
      id: 'rundfunk',
      slug: 'rundfunkbeitrag',
      name: 'Broadcasting fee office',
      local: 'ARD ZDF Deutschlandradio Beitragsservice',
      about: 'Collects the public TV and radio fee (Rundfunkbeitrag). Every household in Germany has to pay it, even without a TV.',
      patterns: [/beitragsservice/i, /rundfunkbeitrag/i, /ard zdf deutschlandradio/i],
      letters: ['Zahlungserinnerung — a payment reminder', 'Festsetzungsbescheid — an official decision that you owe the fee plus a late fee', 'Anmeldung — they registered your flat automatically'],
      tips: ['Only one person per household pays. If a flatmate already pays, tell them their contribution number (Beitragsnummer).', 'People on some benefits, like Bürgergeld or BAföG, can apply to be exempt.'],
    },
    {
      id: 'krankenkasse',
      slug: 'krankenkasse',
      name: 'Health insurance',
      local: 'Krankenkasse',
      about: 'Your health insurance company. It pays for doctors and hospitals.',
      patterns: [/krankenkasse/i, /krankenversicherung/i, /\bAOK\b/, /techniker krankenkasse/i, /\bbarmer\b/i, /\bDAK\b/, /\bIKK\b/, /\bBKK\b/, /\bKKH\b/, /\bhkk\b/i, /pflegeversicherung/i],
      letters: ['Beitragsbescheid — how much you pay each month', 'Mahnung — unpaid contributions', 'Anfrage — they need information, for example about your job'],
      tips: ['Contribution debts grow quickly. Ask for a payment plan early.'],
    },
    {
      id: 'familienkasse',
      slug: 'familienkasse',
      name: 'Family benefits office',
      local: 'Familienkasse',
      about: 'Pays child benefit (Kindergeld).',
      patterns: [/familienkasse/i, /kindergeld/i, /kinderzuschlag/i],
      letters: ['Bescheid über Kindergeld — approval or rejection', 'Aufforderung zur Mitwirkung — they need proof, for example a school certificate'],
      tips: ['If you don’t send the requested proof, they can stop the payments.'],
    },
    {
      id: 'rente',
      slug: 'rentenversicherung',
      name: 'Pension insurance',
      local: 'Deutsche Rentenversicherung',
      about: 'Runs the state pension. Your work years are recorded here.',
      patterns: [/rentenversicherung/i, /rentenauskunft/i, /renteninformation/i],
      letters: ['Renteninformation — your yearly pension forecast', 'Kontenklärung — they want to fill gaps in your work history'],
      tips: ['Check that all your work years, including abroad, are listed.'],
    },
    {
      id: 'bafoeg',
      slug: 'bafoeg-amt',
      name: 'Student finance office',
      local: 'BAföG-Amt',
      about: 'Pays BAföG, the state support for students and trainees.',
      patterns: [/bafög/i, /bafoeg/i, /ausbildungsförderung/i],
      letters: ['Bewilligungsbescheid — how much BAföG you get', 'Rückforderung — they want money back'],
      tips: ['Apply for the next period early, so there is no gap in payments.'],
    },
    {
      id: 'hochschule',
      slug: 'hochschule',
      name: 'University',
      local: 'Hochschule',
      about: 'Your university or college.',
      patterns: [/immatrikulation/i, /exmatrikulation/i, /rückmeldung/i, /semesterbeitrag/i, /\buniversität\b/i, /\bhochschule\b/i],
      letters: ['Rückmeldung — pay the semester fee to stay enrolled', 'Exmatrikulation — you will be removed from the university'],
      tips: ['If you miss the semester fee deadline, you can be removed. Pay on time or ask for a delay.'],
    },
    {
      id: 'gericht',
      slug: 'gericht',
      name: 'Court',
      local: 'Gericht',
      about: 'A court. Letters from a court are always important — never ignore them.',
      patterns: [/amtsgericht/i, /landgericht/i, /sozialgericht/i, /verwaltungsgericht/i, /mahngericht/i, /mahnbescheid/i],
      letters: ['Mahnbescheid — a court payment order', 'Ladung — you must appear in court', 'Urteil — a judgment'],
      tips: ['Court deadlines are strict and short. Get advice quickly.'],
    },
    {
      id: 'bussgeld',
      slug: 'bussgeldstelle',
      name: 'Fines office',
      local: 'Bußgeldstelle',
      about: 'Handles fines, for example for speeding or wrong parking.',
      patterns: [/bußgeldstelle/i, /bussgeldstelle/i, /bußgeldbescheid/i, /verwarnungsgeld/i, /ordnungswidrigkeit/i, /ordnungsamt/i, /\bpolizei/i],
      letters: ['Anhörungsbogen — they ask who was driving', 'Verwarnungsgeld — a small fine', 'Bußgeldbescheid — an official fine'],
      tips: ['You don’t have to say who was driving if it was a close relative.', 'You can object to a Bußgeldbescheid within 2 weeks.'],
    },
    {
      id: 'inkasso',
      slug: 'inkasso',
      name: 'Debt collection agency',
      local: 'Inkassounternehmen',
      about: 'A company that collects money for someone else. Check if the debt is real before paying.',
      patterns: [/inkasso/i, /forderungsmanagement/i],
      letters: ['Zahlungsaufforderung — they ask you to pay a debt plus fees'],
      tips: ['Ask for proof of the original debt if you don’t recognise it.', 'Their fees can be too high. A consumer advice centre can check them.'],
    },
    {
      id: 'vermieter',
      slug: 'vermieter',
      name: 'Landlord or property manager',
      local: 'Vermieter / Hausverwaltung',
      about: 'The owner of your flat or the company that manages it.',
      patterns: [/hausverwaltung/i, /\bvermieter/i, /mietvertrag/i, /wohnungsbaugesellschaft/i, /nebenkostenabrechnung/i, /betriebskostenabrechnung/i, /\bmieter\b/i],
      letters: ['Nebenkostenabrechnung — the yearly bill for heating, water and other costs', 'Mieterhöhung — a rent increase', 'Kündigung — notice to end your rental contract'],
      tips: ['You have 12 months to question the yearly utility bill.', 'A tenants’ association (Mieterverein) can check rent increases and notices.'],
    },
    {
      id: 'versorger',
      slug: 'energieversorger',
      name: 'Energy supplier',
      local: 'Energieversorger',
      about: 'The company that sells you electricity, gas or heating.',
      patterns: [/stadtwerke/i, /energieversorgung/i, /stromlieferung/i, /gaslieferung/i, /abschlagszahlung/i, /zählerstand/i, /\bkWh\b/],
      letters: ['Jahresabrechnung — the yearly bill', 'Abschlagsänderung — your monthly payment changes', 'Sperrandrohung — they threaten to cut off supply'],
      tips: ['If they threaten to cut supply, call them right away and ask for a payment plan.'],
    },
  ],
  kinds: [
    { id: 'vollstreckung', type: 'enforcement', local: 'Vollstreckung', name: 'Enforcement notice', about: 'They are about to take the money by force, for example from your bank account or your wages.', urgency: 'high', patterns: [/vollstreckung/i, /pfändung/i, /pfaendung/i, /gerichtsvollzieher/i, /kontopfändung/i] },
    {
      id: 'mahnbescheid', type: 'court-order', local: 'Mahnbescheid', name: 'Court payment order', about: 'A court order to pay. If you do not owe the money, you must object within 2 weeks. If you ignore it, they can take the money by force.', urgency: 'high', patterns: [/mahnbescheid/i, /vollstreckungsbescheid/i],
      steps: ['If you really owe this money, pay it.', 'If you don’t owe it, fill in the objection form (Widerspruch) that came with the letter and send it back to the court within 2 weeks.'],
    },
    { id: 'rueckforderung', type: 'repayment', local: 'Rückforderung', name: 'Request to pay money back', about: 'They believe they paid you too much and want the money back.', urgency: 'high', patterns: [/rückforderung/i, /rueckforderung/i, /überzahlung/i, /erstattungsbescheid/i, /aufhebungs- und erstattungsbescheid/i, /sind von ihnen zu erstatten/i, /zurückzuzahlen/i] },
    {
      id: 'bussgeldbescheid', type: 'fine', local: 'Bußgeldbescheid', name: 'Fine', about: 'An official fine. You can object (Einspruch) within 2 weeks after you receive it.', urgency: 'high', patterns: [/bußgeldbescheid/i, /bussgeldbescheid/i],
      steps: ['If you accept the fine, just pay it. If you think it’s wrong, send an objection (Einspruch) in writing within 2 weeks after you received it.'],
    },
    { id: 'mahnung', type: 'reminder', local: 'Mahnung', name: 'Payment reminder', about: 'You have not paid something on time. Extra fees may be added if you wait longer.', urgency: 'high', patterns: [/mahnung/i, /zahlungserinnerung/i, /säumniszuschl[aä]g/i, /mahngebühr/i, /zahlungsrückstand/i, /rückstand/i, /offene forderung/i, /noch nicht bezahlt/i, /noch nicht beglichen/i] },
    { id: 'festsetzung', type: 'fee-decision', local: 'Festsetzungsbescheid', name: 'Fee decision', about: 'An official decision that you owe a fee, usually because earlier payments were missed. A late fee is often added.', urgency: 'high', patterns: [/festsetzungsbescheid/i] },
    { id: 'anhoerung', type: 'hearing', local: 'Anhörung', name: 'Chance to explain', about: 'They plan to decide something about you and give you the chance to explain your side first.', urgency: 'medium', patterns: [/anhörung/i, /anhoerung/i, /anhörungsbogen/i, /gelegenheit zur stellungnahme/i, /gelegenheit, sich .* zu äußern/i] },
    { id: 'einladung', type: 'appointment', local: 'Einladung / Termin', name: 'Appointment', about: 'They want you to come to an appointment. Missing it without a good reason can have consequences, for example less money from the Jobcenter.', urgency: 'medium', patterns: [/einladung/i, /meldetermin/i, /laden wir sie/i, /bitten wir sie,? (?:am|zu)/i, /vorsprache/i, /persönlich vorzusprechen/i, /zu einem gespräch/i] },
    { id: 'unterlagen', type: 'documents', local: 'Mitwirkung / Unterlagen', name: 'Request for documents', about: 'They need papers or information from you before they can decide.', urgency: 'medium', patterns: [/mitwirkung/i, /fehlende unterlagen/i, /folgende unterlagen/i, /reichen sie .* ein/i, /nachweise? .* (?:vorzulegen|einzureichen)/i, /bitte senden sie uns/i, /benötigen wir/i] },
    { id: 'ablehnung', type: 'rejection', local: 'Ablehnung', name: 'Rejection', about: 'Your application was turned down. You can usually object if you think this is wrong.', urgency: 'medium', patterns: [/ablehnungsbescheid/i, /lehnen? wir .* ab/i, /wird abgelehnt/i, /abgelehnt werden/i, /kann nicht entsprochen werden/i] },
    { id: 'steuerbescheid', type: 'tax-assessment', local: 'Steuerbescheid', name: 'Tax assessment', about: 'The result of your tax return. It shows whether you pay more tax or get money back.', urgency: 'medium', patterns: [/steuerbescheid/i, /bescheid für \d{4} über/i, /einkommensteuer(?:bescheid)?/i] },
    { id: 'bewilligung', type: 'approval', local: 'Bewilligungsbescheid', name: 'Approval', about: 'Your application was approved. The letter shows how much you get and for how long.', urgency: 'low', patterns: [/bewilligungsbescheid/i, /bewilligen wir/i, /wird bewilligt/i, /bewilligt/i] },
    { id: 'kuendigung', type: 'termination', local: 'Kündigung', name: 'Termination notice', about: 'A contract is being ended, for example your flat, job, or a subscription.', urgency: 'high', patterns: [/kündigung/i, /kuendigung/i, /kündigen wir/i] },
    {
      id: 'nebenkosten', type: 'utility-bill', local: 'Nebenkostenabrechnung', name: 'Yearly utility bill', about: 'Your landlord’s yearly bill for heating, water, rubbish and other shared costs. You may pay extra or get money back. You have 12 months to question it.', urgency: 'medium', patterns: [/nebenkostenabrechnung/i, /betriebskostenabrechnung/i, /heizkostenabrechnung/i],
      steps: ['Check the bill carefully. You can ask to see the receipts (Belegeinsicht). You have 12 months to question it.'],
    },
    { id: 'rechnung', type: 'bill', local: 'Rechnung', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\brechnung\b/i, /rechnungsbetrag/i, /jahresabrechnung/i, /abschlagsrechnung/i] },
    { id: 'bescheid', type: 'decision', local: 'Bescheid', name: 'Official decision', about: 'A formal decision by an authority. It is legally binding unless you object in time.', urgency: 'medium', weight: 0.4, patterns: [/bescheid/i] },
  ],
  references: [
    { name: 'Case number', local: 'Aktenzeichen', pattern: /(?:aktenzeichen|\baz\.|geschäftszeichen|gesch\.-?z(?:eichen|\.)|unser zeichen)/gi },
    { name: 'Tax number', local: 'Steuernummer', pattern: /(?:steuernummer|st\.-?nr\.?)/gi },
    { name: 'Tax ID', local: 'Steuer-ID', pattern: /(?:steuerliche identifikationsnummer|identifikationsnummer|steuer-id(?:nr)?\.?|\bidnr\.?)/gi },
    { name: 'Payment reference', local: 'Kassenzeichen', pattern: /kassenzeichen/gi },
    { name: 'Payment reference', local: 'Verwendungszweck', payment: true, pattern: /(?:verwendungszweck|zahlungsreferenz)/gi },
    { name: 'Contribution number', local: 'Beitragsnummer', pattern: /beitragsnummer/gi },
    { name: 'Customer number', local: 'Kundennummer', pattern: /(?:kundennummer|kunden-nr\.?)/gi },
    { name: 'Household number', local: 'BG-Nummer', pattern: /(?:bg-nummer|bg-nr\.?|nummer der bedarfsgemeinschaft)/gi },
    { name: 'Insurance number', local: 'Versicherungsnummer', pattern: /(?:versicherungsnummer|versichertennummer|rentenversicherungsnummer|sozialversicherungsnummer)/gi },
    { name: 'Child benefit number', local: 'Kindergeldnummer', pattern: /kindergeldnummer/gi },
    { name: 'Invoice number', local: 'Rechnungsnummer', pattern: /(?:rechnungsnummer|rechnungs-nr\.?)/gi },
    { name: 'Contract number', local: 'Vertragsnummer', pattern: /(?:vertragsnummer|vertrags-nr\.?|vertragskonto)/gi },
    { name: 'Member number', local: 'Mitgliedsnummer', pattern: /mitgliedsnummer/gi },
  ],
  glossary: [
    { term: 'Bescheid', slug: 'bescheid', pattern: /bescheid/i, meaning: 'Official decision. It becomes final if you don’t object in time.', tip: 'Look at the end of the letter (Rechtsbehelfsbelehrung): it says how long you have to object.' },
    { term: 'Widerspruch', slug: 'widerspruch', pattern: /widerspruch/i, meaning: 'Objection. A written complaint that a decision is wrong. It must be sent before the deadline.', tip: 'Send it in writing and signed, before the deadline. You can add the reasons later.' },
    { term: 'Einspruch', slug: 'einspruch', pattern: /einspruch/i, meaning: 'Objection. Used for tax offices, fines and court orders. It must be sent before the deadline.', tip: 'For tax decisions you can also object online through ELSTER.' },
    { term: 'Rechtsbehelfsbelehrung', slug: 'rechtsbehelfsbelehrung', pattern: /rechtsbehelfsbelehrung|rechtsmittelbelehrung/i, meaning: 'The part at the end that explains how and by when you can object.' },
    { term: 'Frist', slug: 'frist', pattern: /\bfrist/i, meaning: 'Deadline.', tip: 'If you can’t make a deadline, ask for more time (Fristverlängerung) before it ends.' },
    { term: 'Bekanntgabe', slug: 'bekanntgabe', pattern: /bekanntgabe/i, meaning: 'The day the letter counts as delivered. For posted letters, usually 4 days after the date on the letter.' },
    { term: 'Zustellung', slug: 'zustellung', pattern: /zustellung/i, meaning: 'Formal delivery. The delivery date is often written on the envelope — keep it.' },
    { term: 'Aktenzeichen', slug: 'aktenzeichen', pattern: /aktenzeichen|\baz\./i, meaning: 'Case number. Write it on every reply.' },
    { term: 'Kassenzeichen', slug: 'kassenzeichen', pattern: /kassenzeichen/i, meaning: 'Payment reference. Put it in the reference field when you pay.' },
    { term: 'Verwendungszweck', slug: 'verwendungszweck', pattern: /verwendungszweck/i, meaning: 'The reference text for a bank transfer.' },
    { term: 'Mahnung', slug: 'mahnung', pattern: /mahnung/i, meaning: 'Payment reminder. You paid late or not at all.', tip: 'Check first whether you already paid. If not, pay soon — fees go up with every reminder.' },
    { term: 'Mahngebühr', slug: 'mahngebuehr', pattern: /mahngebühr/i, meaning: 'Late fee added because of a reminder.' },
    { term: 'Säumniszuschlag', slug: 'saeumniszuschlag', pattern: /säumniszuschl[aä]g/i, meaning: 'Late payment charge, added for every month you are late.' },
    { term: 'Nachzahlung', slug: 'nachzahlung', pattern: /nachzahlung/i, meaning: 'Extra payment. You owe more than you already paid.' },
    { term: 'Erstattung', slug: 'erstattung', pattern: /erstattung/i, meaning: 'Refund — or, in some letters, a demand that you pay money back. Check who pays whom.' },
    { term: 'Guthaben', slug: 'guthaben', pattern: /guthaben/i, meaning: 'Credit. Money that belongs to you.' },
    { term: 'Forderung', slug: 'forderung', pattern: /forderung/i, meaning: 'Claim. Money someone says you owe.' },
    { term: 'Vollstreckung', slug: 'vollstreckung', pattern: /vollstreckung/i, meaning: 'Enforcement. Taking money by force, for example from your bank account.', tip: 'Act the same day: pay, or call and ask for a payment plan. A debt advice centre can help for free.' },
    { term: 'Pfändung', slug: 'pfaendung', pattern: /pfändung/i, meaning: 'Seizure of money or things to pay a debt.', tip: 'A protected account (P-Konto) keeps a basic amount safe from seizure.' },
    { term: 'Anhörung', slug: 'anhoerung', pattern: /anhörung/i, meaning: 'Your chance to explain your side before they decide.' },
    { term: 'Stellungnahme', slug: 'stellungnahme', pattern: /stellungnahme/i, meaning: 'Your written statement or explanation.' },
    { term: 'Mitwirkungspflicht', slug: 'mitwirkungspflicht', pattern: /mitwirkung/i, meaning: 'Your duty to help, for example by sending documents. If you don’t, they can stop payments.' },
    { term: 'Nachweis', slug: 'nachweis', pattern: /nachweis/i, meaning: 'Proof, for example a payslip, contract or certificate.' },
    { term: 'Unterlagen', slug: 'unterlagen', pattern: /unterlagen/i, meaning: 'Documents or papers.' },
    { term: 'Antrag', slug: 'antrag', pattern: /\bantrag/i, meaning: 'Application.' },
    { term: 'Bewilligung', slug: 'bewilligung', pattern: /bewillig/i, meaning: 'Approval.' },
    { term: 'Ablehnung', slug: 'ablehnung', pattern: /ablehn|abgelehnt/i, meaning: 'Rejection.' },
    { term: 'Leistungen', slug: 'leistungen', pattern: /leistungen/i, meaning: 'Benefits — money or services you get from the state.' },
    { term: 'Leistungsminderung', slug: 'leistungsminderung', pattern: /leistungsminderung|sanktion/i, meaning: 'Cut in your benefits, for example after a missed appointment.' },
    { term: 'Meldetermin', slug: 'meldetermin', pattern: /meldetermin/i, meaning: 'Required appointment at the Jobcenter or employment agency.' },
    { term: 'Bedarfsgemeinschaft', slug: 'bedarfsgemeinschaft', pattern: /bedarfsgemeinschaft/i, meaning: 'Everyone in your household who is counted together for benefits.' },
    { term: 'Aufenthaltstitel', slug: 'aufenthaltstitel', pattern: /aufenthaltstitel/i, meaning: 'Residence permit.' },
    { term: 'Fiktionsbescheinigung', slug: 'fiktionsbescheinigung', pattern: /fiktionsbescheinigung/i, meaning: 'Temporary paper that lets you stay legally while your permit is being processed.' },
    { term: 'Anmeldung', slug: 'anmeldung', pattern: /\banmeldung/i, meaning: 'Registering your address with the city.' },
    { term: 'Rundfunkbeitrag', slug: 'rundfunkbeitrag', pattern: /rundfunkbeitrag/i, meaning: 'Public TV and radio fee. One per household.' },
    { term: 'Beitragsnummer', slug: 'beitragsnummer', pattern: /beitragsnummer/i, meaning: 'Your account number for the TV and radio fee.' },
    { term: 'Lastschrift', slug: 'lastschrift', pattern: /lastschrift|sepa-mandat/i, meaning: 'Direct debit. They take the money from your account automatically.' },
    { term: 'Überweisung', slug: 'ueberweisung', pattern: /überweis/i, meaning: 'Bank transfer.' },
    { term: 'Ratenzahlung', slug: 'ratenzahlung', pattern: /ratenzahlung|in raten/i, meaning: 'Paying in instalments.' },
    { term: 'Stundung', slug: 'stundung', pattern: /stundung/i, meaning: 'Postponing a payment.' },
    { term: 'Steuer-ID', slug: 'steuer-id', pattern: /identifikationsnummer|steuer-id/i, meaning: 'Your personal 11-digit tax ID. It never changes.' },
    { term: 'Nebenkosten', slug: 'nebenkosten', pattern: /nebenkosten|betriebskosten/i, meaning: 'Extra costs on top of the rent, like heating and water.' },
    { term: 'Kaution', slug: 'kaution', pattern: /kaution/i, meaning: 'Rental deposit.' },
    { term: 'Kündigung', slug: 'kuendigung', pattern: /kündigung/i, meaning: 'Ending a contract.' },
    { term: 'Inkasso', slug: 'inkasso', pattern: /inkasso/i, meaning: 'Debt collection.' },
    { term: 'unverzüglich', slug: 'unverzueglich', pattern: /unverzüglich/i, meaning: 'Immediately, without delay.' },
    { term: 'Bußgeld', slug: 'bussgeld', pattern: /bußgeld|bussgeld/i, meaning: 'Fine.' },
    { term: 'Verwarnungsgeld', slug: 'verwarnungsgeld', pattern: /verwarnungsgeld/i, meaning: 'Small fine, up to 55 €.' },
    { term: 'Klage', slug: 'klage', pattern: /\bklage/i, meaning: 'Lawsuit. Going to court.' },
  ],
  samples: [
    {
      id: 'tax',
      title: 'Tax office',
      subtitle: 'Tax bill with a deadline',
      build(today) {
        const letter = addDays(today, -3);
        const year = Number(today.slice(0, 4)) - 1;
        const due = nextWorkday(addDays(letter, 32));
        return `Finanzamt Chemnitz-Mitte
Postfach 12 34 · 09001 Chemnitz

Herrn
Max Beispiel
Musterstraße 12
09111 Chemnitz

Steuernummer: 214/123/45678
Datum: ${formatGermanDate(letter)}

Bescheid für ${year}
über Einkommensteuer

Sehr geehrter Herr Beispiel,

die Einkommensteuer für das Jahr ${year} wird auf 4.812,00 € festgesetzt. Die bereits gezahlte Lohnsteuer wird angerechnet.

Abrechnung
Festgesetzte Einkommensteuer: 4.812,00 €
Abzüglich Lohnsteuer: 4.400,00 €
Nachzahlung: 412,00 €

Bitte zahlen Sie den Betrag von 412,00 € bis zum ${formatGermanDate(due)} auf folgendes Konto:
Empfänger: Finanzamt Chemnitz-Mitte
IBAN: DE89 3704 0044 0532 0130 00
BIC: COBADEFFXXX
Verwendungszweck: 214/123/45678 ESt ${year}

Bei Zahlung nach Ablauf des Fälligkeitstages entstehen Säumniszuschläge.

Rechtsbehelfsbelehrung
Gegen diesen Bescheid ist der Einspruch gegeben. Der Einspruch ist innerhalb eines Monats nach Bekanntgabe dieses Bescheides beim Finanzamt Chemnitz-Mitte schriftlich oder elektronisch einzulegen.

Mit freundlichen Grüßen
Ihr Finanzamt Chemnitz-Mitte`;
      },
    },
    {
      id: 'jobcenter',
      title: 'Jobcenter',
      subtitle: 'Appointment invitation',
      build(today) {
        const letter = addDays(today, -2);
        const appointment = nextWorkday(addDays(today, 8));
        return `Jobcenter Leipzig
Georg-Schumann-Straße 150 · 04159 Leipzig

Frau
Erika Muster
Beispielweg 3
04109 Leipzig

BG-Nummer: 05301//0012345
Kundennummer: 123D456789
Datum: ${formatGermanDate(letter)}

Einladung zum Meldetermin

Sehr geehrte Frau Muster,

bitte kommen Sie am ${formatGermanDate(appointment)} um 09:30 Uhr in das Jobcenter Leipzig, Raum 2.14.

Ich möchte mit Ihnen über Ihre aktuelle berufliche Situation sprechen.

Bitte bringen Sie folgende Unterlagen mit:
- diese Einladung
- Ihren Personalausweis oder Reisepass
- Ihren aktuellen Lebenslauf

Wenn Sie ohne wichtigen Grund nicht zu diesem Termin erscheinen, kann Ihr Bürgergeld um 10 Prozent gemindert werden (Leistungsminderung).

Wenn Sie den Termin nicht wahrnehmen können, teilen Sie mir dies bitte vorher mit.

Mit freundlichen Grüßen
Im Auftrag
J. Schneider`;
      },
    },
    {
      id: 'fee',
      title: 'TV and radio fee',
      subtitle: 'Payment reminder',
      build(today) {
        const letter = addDays(today, -4);
        const due = nextWorkday(addDays(today, 10));
        const { start, end } = quarterBefore(today);
        return `ARD ZDF Deutschlandradio
Beitragsservice
50656 Köln

Herrn
Ali Beispiel
Lindenallee 7
01067 Dresden

Beitragsnummer: 123 456 789
Datum: ${formatGermanDate(letter)}

Zahlungserinnerung

Sehr geehrter Herr Beispiel,

auf Ihrem Beitragskonto ist ein Rückstand entstanden. Für den Zeitraum vom ${formatGermanDate(start)} bis ${formatGermanDate(end)} haben wir noch keine Zahlung erhalten.

Offener Betrag: 55,08 €

Bitte überweisen Sie den offenen Betrag bis zum ${formatGermanDate(due)} auf folgendes Konto:
Empfänger: ARD ZDF Deutschlandradio Beitragsservice
IBAN: DE89 3704 0044 0532 0130 00
Verwendungszweck: Beitragsnummer 123 456 789

Wenn Sie bereits gezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.

Erfolgt keine Zahlung, müssen wir einen Festsetzungsbescheid erlassen. Dabei entsteht ein Säumniszuschlag von mindestens 8,00 €.

Mit freundlichen Grüßen
Ihr Beitragsservice`;
      },
    },
  ],
};
