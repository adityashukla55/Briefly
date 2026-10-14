import { addDays, addMonths, formatLocalDate, fromIso } from '../dates.js';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

const belgianDate = (iso) => formatLocalDate(iso, '/', 'dmy');

function frenchDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${JOURS[fromIso(iso).getUTCDay()]} ${day} ${MOIS[month - 1]} ${year}`;
}

function frenchLongDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MOIS[month - 1]} ${year}`;
}

function amountOf(result, locale, fallback) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency ?? 'EUR' }).format(money.amount) : fallback;
}

function reference(result, name) {
  return result.references.find((item) => item.name === name)?.value ?? null;
}

const vanBrief = (result) => (result.letterDate ? `van ${belgianDate(result.letterDate)}` : 'van [DD/MM/JJJJ]');
const duCourrier = (result) => (result.letterDate ? `du ${belgianDate(result.letterDate)}` : 'du [JJ/MM/AAAA]');

const REFERENCES = [
  { name: 'Case number', local: { nl: 'Dossiernummer', fr: 'N° de dossier' }, pattern: /(?:\bdossiernummer|\bdossier\s?(?:nr|n°|no)\.?|\bnuméro de dossier|\bn°\s?de dossier|\bons kenmerk|\buw kenmerk|\bnotre référence|\bvotre référence|\bonze referentie|\breferentie|\bréférence)(?!\s*:?\s*[+*]{3})/gi },
  { name: 'Tax article number', local: { nl: 'Artikelnummer', fr: 'N° d’article' }, pattern: /(?:\bartikelnummer|\bartikel\s?(?:nr|n°)\.?|\bnuméro d['’]article|\bn°\s?d['’]article)/gi },
  { name: 'Court case number', local: { nl: 'Rolnummer', fr: 'N° de rôle' }, pattern: /(?:\brolnummer|\brol\s?(?:nr|n°)\.?|\bnuméro de rôle|\bn°\s?de rôle|\bA\.R\.|\bR\.G\.)/gi },
  { name: 'Police report number', local: { nl: 'PV-nummer', fr: 'N° de PV' }, pattern: /(?:\bPV[- ]?(?:nummer|nr\.?|n°)|\bproces-verbaal\s?(?:nr|n°)\.?|\bprocès-verbal\s?(?:n°|numéro)|\bn°\s?(?:de\s)?PV)/gi },
  { name: 'Customer number', local: { nl: 'Klantnummer', fr: 'N° de client' }, pattern: /(?:\bklantnummer|\bklant\s?(?:nr|n°)\.?|\bnuméro de client|\bn°\s?(?:de\s)?client|\bcontractnummer|\bnuméro de contrat)/gi },
  { name: 'Invoice number', local: { nl: 'Factuurnummer', fr: 'N° de facture' }, pattern: /(?:\bfactuurnummer|\bfactuur\s?(?:nr|n°)\.?|\bnuméro de facture|\bn°\s?de facture)/gi },
  { name: 'EAN code', local: { nl: 'EAN', fr: 'EAN' }, pattern: /\bEAN(?:[- ]code)?/gi },
  { name: 'National register number', local: { nl: 'Rijksregisternummer', fr: 'N° de registre national' }, personal: true, pattern: /(?:\brijksregisternummer|\brijksregister\s?(?:nr|n°)\.?|\bINSZ(?:-nummer)?|\bnuméro (?:de |du )?registre national|\bn°\s?(?:de |du )?registre national|\bNISS|\bnuméro national)/gi },
  { name: 'Structured communication', local: { nl: 'Gestructureerde mededeling', fr: 'Communication structurée' }, payment: true, value: /[+*]{3}\s?\d{3}\s?\/\s?\d{4}\s?\/\s?\d{5}\s?[+*]{3}/, pattern: /(?:gestructureerde mededeling|communication structurée|\bmededeling|\bcommunication)/gi },
  ];

const referencesIn = (language) => REFERENCES.map((item) => ({ ...item, local: item.local[language] }));

export default {
  id: 'be',
  slug: 'belgium',
  name: 'Belgium',
  adjective: 'Belgian',
  flag: '🇧🇪',
  language: 'nl',
  languages: ['nl', 'fr'],
  locale: 'nl-BE',
  currency: 'EUR',
  decimal: ',',
  thousands: '. ',
  dateSeparator: '/',
  dateOrder: 'dmy',
  ibanLength: 16,
  intro: 'Belgian offices write in Dutch, French or German, depending on where you live. Briefly reads Dutch and French letters. Many letters can also arrive in your eBox or MyMinfin online, and deadlines often start on the third working day after the letter was sent.',
  signals: [
    /\bBelgi(?:ë|e|que|um)\b/i,
    /\.be\b/i,
    /\bBE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\b/,
    /[+*]{3}\s?\d{3}\s?\/\s?\d{4}\s?\/\s?\d{5}\s?[+*]{3}/,
    /\b(?:FOD|SPF) (?:Financiën|Finances)\b|\bMyMinfin\b/i,
    /rijksregister|registre national|\bINSZ\b|\bNISS\b/i,
    /\b(?:OCMW|CPAS|RVA|ONEM|VDAB|Actiris|Forem|RSZ|ONSS)\b/,
    /\b(?:ziekenfonds|mutualiteit|mutualité|mutuelle)\b/i,
    /gerechtsdeurwaarder|huissier de justice/i,
    /aanslagbiljet|avertissement-extrait de rôle/i,
    /gestructureerde mededeling|communication structurée/i,
    /\bendéans\b|\bseptante\b|\bnonante\b/i,
    /\b[1-9]\d{3}\s+(?:Brussel|Bruxelles|Antwerpen|Anvers|Gent|Gand|Liège|Luik|Namur|Namen|Charleroi|Brugge|Bruges|Leuven|Louvain|Mons|Bergen|Hasselt|Mechelen|Malines|Kortrijk|Courtrai|Aalst|Oostende|Ostende|Genk|Tournai|Doornik|Verviers|Wavre|Waver|Arlon|Aarlen|Sint-Niklaas|Roeselare|Turnhout|Ixelles|Elsene|Schaerbeek|Schaarbeek|Anderlecht|Molenbeek|Uccle|Ukkel|Etterbeek|Forest|Vorst)\b/,
  ],
  deliveryDays: 3,
  deliveryNote: 'In Belgium, a letter sent by post is usually treated as received on the third working day after the date it was sent. Many deadlines, for example 6 months to object to a tax bill, start from that day.',
  deadlineWords: ['termijn', 'uiterlijk op', 'délai', 'au plus tard le'],
  objectionAdvice: 'Use this if you think the decision is wrong. Send it before the deadline, signed, by registered post (aangetekend / recommandé) or through the online service named in the letter, and keep a copy. For benefit decisions, the letter usually says you must go to the labour court (arbeidsrechtbank / tribunal du travail) — often within 3 months.',
  objectionDefault: 'bezwaar',
  objection: [
    { word: 'bezwaarschrift', pattern: /bezwaarschrift/i },
    { word: 'beroep', pattern: /\bberoep\b/i },
    { word: 'verzet', pattern: /\bverzet\b/i },
    { word: 'bezwaar', pattern: /\bbezwaar\b/i },
  ],
  help: {
    debt: 'free debt help from your OCMW / CPAS or a recognised debt mediation service (schuldbemiddeling / médiation de dettes)',
    tenant: 'a tenants’ association (Huurdersbond / Syndicat des locataires) or a free legal advice office (justitiehuis / maison de justice)',
    instalments: 'afbetalingsplan',
    general: 'the OCMW / CPAS, your union or health insurance fund, or a free first-line legal advice office (juridische eerstelijnsbijstand / aide juridique de première ligne)',
  },
  paymentReference: /(?:gestructureerde mededeling|mededeling|communication structurée|communication)\s*:?\s*([+*]{3}\s?\d{3}\s?\/\s?\d{4}\s?\/\s?\d{5}\s?[+*]{3})/i,
  senders: [
    {
      id: 'fin',
      slug: 'fod-financien-spf-finances',
      name: 'Federal tax office',
      local: 'FOD Financiën / SPF Finances',
      about: 'The federal tax office. It handles personal income tax, and in Wallonia also the yearly property tax.',
      patterns: [/FOD Financi[eë]n/i, /SPF Finances/i, /\bMyMinfin\b/i, /aanslagbiljet/i, /avertissement-extrait de rôle/i, /personenbelasting/i, /impôt des personnes physiques/i, /aanslagjaar|exercice d['’]imposition/i, /\btax-on-web\b/i, /inningscentrum|centre de perception/i],
      letters: ['Aanslagbiljet / avertissement-extrait de rôle — your income tax bill or refund for one year', 'Voorstel van vereenvoudigde aangifte / proposition de déclaration simplifiée — a ready-made tax return to check', 'Herinnering / rappel — tax that wasn’t paid on time'],
      tips: ['Check the bill in MyMinfin. To object, send a bezwaarschrift / réclamation within 6 months from the third working day after the sending date.', 'Always pay with the structured communication (+++…+++) from the bill, so the payment is linked to you.'],
    },
    {
      id: 'regional-tax',
      slug: 'regional-tax-office',
      name: 'Regional tax office',
      local: 'Vlaamse Belastingdienst / Brussel Fiscaliteit / SPW Fiscalité',
      about: 'The tax office of your region. It handles regional taxes such as property tax (onroerende voorheffing / précompte immobilier) in Flanders and Brussels, inheritance and registration duties.',
      patterns: [/Vlaamse Belastingdienst|\bVLABEL\b/i, /Brussel Fiscaliteit|Bruxelles Fiscalité/i, /SPW Fiscalité/i, /onroerende voorheffing/i, /précompte immobilier/i, /\bverkeersbelasting\b|taxe de circulation/i, /erfbelasting|droits de succession/i],
      letters: ['Aanslagbiljet onroerende voorheffing / avertissement-extrait de rôle précompte immobilier — yearly property tax', 'Verkeersbelasting / taxe de circulation — yearly car tax', 'Herinnering / rappel — a payment is late'],
      tips: ['If you rent your home, the owner usually pays the property tax — but check your rental contract.', 'The letter says how long you have to object. Use the online form or the address in the letter.'],
    },
    {
      id: 'commune',
      slug: 'gemeente-commune',
      name: 'Town hall',
      local: 'Gemeente / Commune',
      about: 'Your local town hall. It handles your registration (domicile), identity card, residence cards for foreigners, local taxes and local fines.',
      patterns: [/\bgemeente\b/i, /\bstad (?:antwerpen|gent|brussel|leuven|brugge|mechelen)\b/i, /\badministration communale\b/i, /\bcommune\b/i, /\bvilles? de\b/i, /dienst bevolking|service (?:de la )?population/i, /\bschepen\b|(?<![A-Za-zÀ-ɏ])échevin\b/i, /college van burgemeester|collège communal/i, /gemeentebelasting|taxe communale/i],
      letters: ['Uitnodiging / convocation — come to the town hall, for example for your identity card or residence card', 'Woonstcontrole / enquête de domicile — the police check that you really live at your address', 'Gemeentebelasting / taxe communale — a local tax bill'],
      tips: ['Tell the town hall when you move. A wrong address can make you miss important letters.', 'For a residence card, go to the appointment — missing it can delay your residence rights.'],
    },
    {
      id: 'ocmw',
      slug: 'ocmw-cpas',
      name: 'Social welfare office',
      local: 'OCMW / CPAS',
      about: 'The local public social welfare centre. It gives the living wage (leefloon / revenu d’intégration), emergency help and debt help.',
      patterns: [/\bOCMW\b/, /\bCPAS\b/, /leefloon/i, /revenu d['’]intégration/i, /maatschappelijk werker|assistant(?:e)? social(?:e)?/i, /sociaal huis/i, /\bGPMI\b|\bPIIS\b/],
      letters: ['Beslissing / décision — whether you get the living wage or other help, and how much', 'Uitnodiging / convocation — an appointment with your social worker', 'Terugvordering / récupération — they want money back'],
      tips: ['You can appeal a decision at the labour court (arbeidsrechtbank / tribunal du travail) within 3 months. It is free.', 'Ask your social worker about debt help and energy help — many OCMWs / CPAS offer both.'],
    },
    {
      id: 'rva',
      slug: 'rva-onem',
      name: 'Unemployment office',
      local: 'RVA / ONEM',
      about: 'The national employment office. It decides on unemployment benefits. The money is usually paid by your union or by the HVW / CAPAC.',
      patterns: [/\bRVA\b/, /\bONEM\b/, /Rijksdienst voor Arbeidsvoorziening/i, /Office national de l['’]Emploi/i, /werkloosheidsuitkering|uitkering(?:en)? bij werkloosheid/i, /allocations? de chômage/i, /\bHVW\b|\bCAPAC\b/, /uitbetalingsinstelling|organisme de paiement/i],
      letters: ['Beslissing / décision — whether you get unemployment benefits, or a sanction', 'Terugvordering / récupération — benefits paid too much', 'Oproeping / convocation — an interview at the RVA / ONEM office'],
      tips: ['You can appeal at the labour court within 3 months of the decision. Your union can help.', 'Report changes like work, a move or a new household member quickly, to avoid having to pay money back.'],
    },
    {
      id: 'employment',
      slug: 'vdab-actiris-forem',
      name: 'Job centre',
      local: 'VDAB / Actiris / Le Forem',
      about: 'The regional job service: VDAB in Flanders, Actiris in Brussels, Le Forem in Wallonia. It helps you find work and checks your job search.',
      patterns: [/\bVDAB\b/, /\bActiris\b/i, /\bForem\b/i, /bemiddelaar|conseiller(?:ère)? (?:emploi|référent)/i, /werkzoekende|demandeur d['’]emploi/i, /beschikbaarheid|disponibilité/i],
      letters: ['Uitnodiging / convocation — an appointment with your job counsellor', 'Evaluatie van je zoekgedrag / évaluation de votre recherche active d’emploi — a check of your job search', 'Beslissing / décision — after a check, possibly a sanction on your benefits'],
      tips: ['Go to every appointment, or tell them before if you can’t come and why. Missing it can cut your unemployment benefits.', 'Keep proof of your job applications — emails, letters and answers.'],
    },
    {
      id: 'health-fund',
      slug: 'ziekenfonds-mutualite',
      name: 'Health insurance fund',
      local: 'Ziekenfonds / Mutualité',
      about: 'Your health insurance fund. It pays back part of medical costs and pays sickness benefits when you can’t work.',
      patterns: [/ziekenfonds/i, /mutualiteit|mutualité|mutuelle/i, /\bCM\b|\bMC\b|Solidaris|Partena|Helan|Liberale Mutualiteit/i, /arbeidsongeschikt|incapacité de travail/i, /adviserend arts|médecin-conseil/i, /\bRIZIV\b|\bINAMI\b/],
      letters: ['Beslissing arbeidsongeschiktheid / décision d’incapacité — whether you still get sickness benefits', 'Oproeping adviserend arts / convocation chez le médecin-conseil — a check with their doctor', 'Terugvordering / récupération — benefits paid too much'],
      tips: ['Go to the appointment with their doctor and bring your medical papers. If you can’t come, tell them before.', 'You can appeal a decision at the labour court within 3 months.'],
    },
    {
      id: 'family',
      slug: 'groeipakket-allocations-familiales',
      name: 'Child benefit office',
      local: 'Groeipakket / Allocations familiales',
      about: 'Pays child benefit. In Flanders it is called Groeipakket, in Brussels Famiris, in Wallonia it is paid by the family allowance funds.',
      patterns: [/groeipakket/i, /kinderbijslag/i, /allocations familiales/i, /\bFamiris\b/i, /\bFamiwal\b|Parentia|Kidslife|Infino|MyFamily|\bFONS\b|\bCamille\b/i, /schooltoeslag|allocation scolaire/i],
      letters: ['Beslissing / décision — what you get each month for your children', 'Vraag om gegevens / demande d’informations — they need information or papers', 'Terugvordering / récupération — they paid too much'],
      tips: ['Tell your fund when your family situation changes, for example a move, a new partner or a child who starts working.', 'If they ask for papers, send them by the date in the letter to avoid a pause in payments.'],
    },
    {
      id: 'immigration',
      slug: 'dvz-office-des-etrangers',
      name: 'Immigration office',
      local: 'Dienst Vreemdelingenzaken / Office des Étrangers',
      about: 'The federal immigration office. It decides on residence rights, visas and orders to leave the country.',
      patterns: [/Dienst Vreemdelingenzaken|\bDVZ\b/i, /Office des [EÉ]trangers/i, /verblijfsrecht|droit de séjour/i, /verblijfskaart|carte de séjour/i, /bevel om het grondgebied te verlaten|ordre de quitter le territoire/i, /Raad voor Vreemdelingenbetwistingen|\bRvV\b/i, /Conseil du Contentieux des [EÉ]trangers|\bCCE\b/i, /\bbijlage \d{1,2}\b|\bannexe \d{1,2}\b/i],
      letters: ['Beslissing over verblijf / décision de séjour — your residence was approved or refused', 'Bevel om het grondgebied te verlaten / ordre de quitter le territoire — you must leave the country by a set date', 'Vraag om documenten / demande de documents — they need more papers'],
      tips: ['Deadlines to appeal are short — often 30 days, sometimes only 10 or 5 days. Contact a lawyer or a free legal aid office (pro deo) right away.', 'Keep a copy of every paper you send and receive, and note the date you received it.'],
    },
    {
      id: 'bailiff',
      slug: 'gerechtsdeurwaarder-huissier',
      name: 'Bailiff',
      local: 'Gerechtsdeurwaarder / Huissier de justice',
      about: 'A legal officer who delivers court papers and collects debts after a judgment. He or she can also start amicable debt collection before court.',
      patterns: [/gerechtsdeurwaarder/i, /huissier de justice/i, /bevel tot betalen|commandement de payer/i, /\bbeslag\b|\bsaisie\b/i, /betekening|signification/i, /\bexploot\b|\bexploit\b/i, /minnelijke invordering|recouvrement amiable/i],
      letters: ['Bevel tot betalen / commandement de payer — pay after a judgment, or goods can be seized', 'Beslag / saisie — money or goods are being seized', 'Minnelijke invordering / recouvrement amiable — a reminder before going to court'],
      tips: ['Call the bailiff today and ask for a payment plan. Costs go up with every new step.', 'Part of your wage and benefits is protected and can’t be seized. Ask the OCMW / CPAS or a debt mediator for help.'],
    },
    {
      id: 'court',
      slug: 'rechtbank-tribunal',
      name: 'Court',
      local: 'Vredegerecht / Rechtbank — Justice de paix / Tribunal',
      about: 'A court. The justice of the peace (vredegerecht / justice de paix) handles rent, small debts and neighbour problems.',
      patterns: [/vredegerecht|justice de paix/i, /rechtbank|tribunal/i, /dagvaarding|citation/i, /\bvonnis\b|\bjugement\b/i, /\bgriffie\b|\bgreffe\b/i, /rolnummer|numéro de rôle|\bA\.R\./i, /politierechtbank|tribunal de police/i],
      letters: ['Dagvaarding / citation — you must come to court on a set date', 'Vonnis / jugement — the court’s decision', 'Oproeping / convocation — an invitation to a hearing'],
      tips: ['Go to the hearing, or send a lawyer. If you don’t come, the judge can decide without you.', 'If your income is low, you can get a free or cheap lawyer (pro deo / aide juridique).'],
    },
    {
      id: 'police',
      slug: 'politie-police',
      name: 'Police and traffic fines',
      local: 'Politie / Police — Parket / Parquet',
      about: 'Sends traffic fines and other police letters. Unpaid fines go to the public prosecutor (parket / parquet).',
      patterns: [/\bpolitie\b|\bpolice\b/i, /\bparket\b|\bparquet\b/i, /onmiddellijke inning|perception immédiate/i, /minnelijke schikking|transaction pénale/i, /verkeersovertreding|infraction (?:de roulage|routière)/i, /\bflitspaal|radar/i, /\bPV\b|proces-verbaal|procès-verbal/i, /crossborder|fines\.be|amendes\.be|verkeersboetes/i],
      letters: ['Voorstel tot onmiddellijke inning / perception immédiate — a traffic fine to pay by the date in the letter', 'Minnelijke schikking / transaction — a higher offer from the prosecutor after an unpaid fine', 'Vraag om de bestuurder te identificeren / demande d’identification du conducteur — say who was driving'],
      tips: ['If you weren’t the driver, say who was driving by the date in the letter (usually within 15 days).', 'If you don’t pay or answer, the fine usually goes up or you are summoned to the police court.'],
    },
    {
      id: 'collection',
      slug: 'incassobureau-recouvrement',
      name: 'Debt collector',
      local: 'Incassobureau / Bureau de recouvrement',
      about: 'A company that collects debts for others. In Belgium it must be registered and may not charge you extra costs that aren’t in your contract.',
      patterns: [/incasso(?:bureau|kantoor)?/i, /bureau de recouvrement|recouvrement de créances/i, /schuldvordering|créance/i, /schuldeiser|créancier/i, /\bFOD Economie\b|\bSPF Economie\b/i],
      letters: ['Aanmaning / rappel — they ask you to pay a debt, with at least 15 days to do so', 'Voorstel afbetalingsplan / proposition de plan de paiement — they offer a payment plan', 'Laatste aanmaning / dernier rappel — they plan to go to a bailiff or court'],
      tips: ['Check that the debt is yours and the amount is right. Ask for proof (the contract and invoices) if not.', 'Collection agencies may not call you at night, visit your work or threaten you. Report abuse to the FOD Economie / SPF Economie.'],
    },
    {
      id: 'energy',
      slug: 'energieleverancier-fournisseur-energie',
      name: 'Energy supplier',
      local: 'Energieleverancier / Fournisseur d’énergie',
      about: 'The company that sells you electricity or gas, for example Engie, Luminus or TotalEnergies.',
      patterns: [/energieleverancier|fournisseur d['’]énergie/i, /\bEngie\b|\bLuminus\b|TotalEnergies|\bEneco\b|Mega|Octa\+|Bolt/i, /\bkWh\b/i, /afrekening|décompte|facture de régularisation/i, /voorschot(?:factuur)?|acompte/i, /\bEAN\b/, /budgetmeter|compteur à budget/i, /meterstand|relevé (?:de|du) compteur/i],
      letters: ['Afrekening / décompte — the yearly bill after your meter reading', 'Voorschotfactuur / facture d’acompte — your monthly advance payment', 'Aanmaning / rappel — an unpaid bill; after this a budget meter or cut-off procedure can follow'],
      tips: ['Can’t pay? Call them and ask for a payment plan. In Belgium, suppliers must offer one.', 'If you have a low income, ask about the social tariff (sociaal tarief / tarif social).'],
    },
    {
      id: 'landlord',
      slug: 'verhuurder-bailleur',
      name: 'Landlord',
      local: 'Verhuurder / Bailleur',
      about: 'The owner of your home, or the agency that manages it.',
      patterns: [/verhuurder|bailleur/i, /huurder|locataire/i, /huurovereenkomst|contrat de bail|\bbail\b/i, /huurwaarborg|garantie locative/i, /opzeg(?:ging)?|\bcongé(?![A-Za-zÀ-ɏ])|résiliation du bail/i, /indexering van de huur|indexation du loyer/i, /\bhuur\b|\bloyer\b/i],
      letters: ['Opzegging / congé — your landlord ends the rental contract', 'Indexering / indexation — your rent goes up with the index', 'Huurachterstand / arriérés de loyer — you are behind with rent'],
      tips: ['Only a judge (vrederechter / juge de paix) can make you leave. A landlord may not change the locks or remove your things.', 'Notice rules are strict and differ by region. Check with a tenants’ association before you agree to leave.'],
    },
  ],
  kinds: [
    {
      id: 'enforcement', type: 'enforcement', local: 'Bevel tot betalen / beslag — Commandement de payer / saisie', name: 'Enforcement by a bailiff', about: 'A bailiff (gerechtsdeurwaarder / huissier) will collect a debt after a judgment or tax bill. Goods or money can be seized, and costs go up at every step.', urgency: 'high', objection: false, patterns: [/bevel tot betalen|commandement de payer/i, /\bbeslag\b|\bsaisie\b/i, /gedwongen invordering|recouvrement forcé/i, /uitvoerbare titel|titre exécutoire/i, /dwangbevel|contrainte/i],
      steps: ['Call the bailiff today. Offer an amount you can really pay each month. Ask the OCMW / CPAS or a debt mediator for help.', 'If you think the debt is not yours or already paid, send proof to the bailiff right away.'],
    },
    {
      id: 'summons', type: 'court-order', local: 'Dagvaarding / Citation', name: 'Court summons', about: 'Someone is taking you to court. The paper says when and where the hearing is.', urgency: 'high', objection: false, extendable: false, patterns: [/dagvaarding/i, /\bcitation\b/i, /te verschijnen (?:op|voor)|comparaître/i, /terechtzitting|audience/i, /oproeping (?:voor|ter)/i],
      steps: ['Go to the hearing on the date in the summons, or send a lawyer. If you don’t come, the judge can decide without you.', 'Get legal help now. If your income is low, ask for a free lawyer (pro deo / aide juridique de deuxième ligne).'],
    },
    {
      id: 'formal-notice', type: 'reminder', local: 'Ingebrekestelling / Mise en demeure', name: 'Formal demand to pay', about: 'The last official warning before court or a bailiff. It often adds interest or a fixed fee.', urgency: 'high', patterns: [/ingebrekestelling/i, /mise en demeure/i, /in gebreke (?:gesteld|stellen)/i, /laatste aanmaning|dernier rappel/i],
      steps: ['Pay by the date in the letter, or contact them now and ask for a payment plan. If you dispute the debt, say so in writing. There is a ready-made letter below.'],
    },
    {
      id: 'reminder', type: 'reminder', local: 'Aanmaning / herinnering — Rappel', name: 'Payment reminder', about: 'A payment is late. Reminders often add costs or interest if you wait longer.', urgency: 'high', patterns: [/aanmaning/i, /herinnering/i, /\brappel\b/i, /achterstallig|arriéré/i, /onbetaald|impayé/i, /nog niet betaald|pas encore (?:été )?payé/i],
      steps: ['If a debt collector sends this, they must give you at least 15 days to pay before taking further steps.'],
    },
    {
      id: 'repayment', type: 'repayment', local: 'Terugvordering / Récupération de l’indu', name: 'Request to pay money back', about: 'They say they paid you too much, for example unemployment, sickness or child benefits, and want the money back.', urgency: 'high', patterns: [/terugvordering/i, /ten onrechte (?:betaald|ontvangen|uitbetaald)/i, /terug te betalen/i, /récupération/i, /\bindu(?:ment)?\b/i, /à rembourser|remboursement de/i, /payé(?:es|s)? indûment/i],
      steps: ['If you think it’s wrong, appeal at the labour court (arbeidsrechtbank / tribunal du travail) within 3 months.', 'If it wasn’t your fault and you can’t pay it back, ask them to cancel or lower the debt (verzaking / renonciation).'],
    },
    {
      id: 'traffic-fine', type: 'fine', local: 'Verkeersboete — Onmiddellijke inning / Perception immédiate', name: 'Traffic fine', about: 'A fine for a traffic offence, often from a speed camera. Pay by the date in the letter to close the case.', urgency: 'high', objection: false, patterns: [/onmiddellijke inning/i, /perception immédiate/i, /minnelijke schikking/i, /transaction pénale|\btransaction\b/i, /verkeersovertreding|infraction (?:de roulage|routière)/i, /snelheidsovertreding|excès de vitesse/i],
      steps: ['If you weren’t driving, say who was driving within the time in the letter (usually 15 days) instead of paying.', 'If you don’t pay, a higher settlement offer or a case at the police court can follow.'],
    },
    {
      id: 'sac', type: 'fine', local: 'GAS-boete / Amende administrative (SAC)', name: 'Town hall fine', about: 'A fine from the town hall for things like parking, litter or noise (municipal administrative sanction).', urgency: 'medium', patterns: [/\bGAS-?boete\b|gemeentelijke administratieve sanctie/i, /\bSAC\b|sanction administrative communale/i, /amende administrative/i, /sanctionerend ambtenaar|fonctionnaire sanctionnateur/i, /retributie|redevance de stationnement/i],
      steps: ['You can usually send your defence in writing first (often within 15 days). After the decision, you can appeal at the police court within one month.'],
    },
    {
      id: 'tax-bill', type: 'tax-assessment', local: 'Aanslagbiljet / Avertissement-extrait de rôle', name: 'Tax bill', about: 'Your tax bill for one year. It shows if you must pay, or get money back.', urgency: 'medium', patterns: [/aanslagbiljet/i, /avertissement-extrait de rôle/i, /\bAER\b/, /aanslagjaar/i, /exercice d['’]imposition/i, /personenbelasting|impôt des personnes physiques/i, /onroerende voorheffing|précompte immobilier/i],
      steps: ['Check the figures in MyMinfin. If you disagree, you can object (bezwaarschrift / réclamation) within 6 months — online in MyMinfin or by post. Objecting doesn’t pause the payment.', 'Pay with the structured communication (+++…+++) from the bill. If you can’t pay on time, ask for a payment plan before the due date.'],
    },
    {
      id: 'decision', type: 'decision', local: 'Beslissing / Décision', name: 'Decision', about: 'A decision about your benefits, residence or another request — for example what you get, a change or a sanction.', urgency: 'medium', patterns: [/\bbeslissing\b/i, /\bdécision\b/i, /wij hebben beslist|nous avons décidé/i, /\bsanctie\b|\bsanction\b/i, /\buitsluiting\b|\bexclusion\b/i],
      steps: ['Read the part about your right to appeal (beroepsmogelijkheden / voies de recours). For benefits, you can usually go to the labour court within 3 months, for free.'],
    },
    {
      id: 'order-to-leave', type: 'decision', local: 'Bevel om het grondgebied te verlaten / Ordre de quitter le territoire', name: 'Order to leave the country', about: 'The immigration office says you must leave Belgium by a set date. You can usually appeal, but the deadline is short.', urgency: 'high', objection: false, extendable: false, instalments: false, patterns: [/bevel om het grondgebied te verlaten/i, /ordre de quitter le territoire/i, /\bOQT\b|\bBGV\b/, /bijlage 13|annexe 13/i],
      steps: ['Contact a lawyer or a free legal aid office today. An appeal to the RvV / CCE is often possible within 30 days, sometimes only 10 or 5 days.'],
    },
    {
      id: 'refusal', type: 'rejection', local: 'Weigering / Refus', name: 'Refusal', about: 'Your request was refused. The letter says if and how you can challenge it, and by when.', urgency: 'medium', patterns: [/\bweiger(?:ing|en|d)\b/i, /\brefus(?:é|ée)?\b/i, /niet (?:toegekend|ingewilligd|aanvaard)/i, /(?:ne peut|n['’]est) pas (?:être )?(?:accordé|accepté)/i, /onontvankelijk|irrecevable/i],
      steps: ['Look for the part about your right to appeal. Deadlines differ: often 1 to 3 months, but only days for some immigration decisions.'],
    },
    { id: 'approval', type: 'approval', local: 'Toekenning / Octroi', name: 'Approval', about: 'Your request was approved. Check that the amounts and dates are right.', urgency: 'low', patterns: [/toegekend|toekenning/i, /goedgekeurd/i, /\baccordé(?:e)?(?![A-Za-zÀ-ɏ])|\boctroi\b/i, /nous avons le plaisir/i, /wij hebben het genoegen/i] },
    {
      id: 'appointment', type: 'appointment', local: 'Uitnodiging / Convocation', name: 'Appointment', about: 'They want you to come to an appointment, for example at the town hall, the job centre or a doctor. Missing it can cut your benefits or delay your case.', urgency: 'medium', patterns: [/uitnodiging/i, /\boproeping\b/i, /\bafspraak\b/i, /convocation/i, /\bconvoqué(?:e)?(?![A-Za-zÀ-ɏ])/i, /vous présenter|zich (?:aan)?melden|aanmelden/i, /\bentretien\b|\bgesprek\b/i],
    },
    {
      id: 'documents', type: 'documents', local: 'Vraag om documenten / Demande de documents', name: 'Request for documents', about: 'They need papers or information before they can decide, or to keep paying you.', urgency: 'medium', patterns: [/vraag om (?:inlichtingen|gegevens|documenten|bewijsstukken)/i, /demande (?:de |d['’])(?:renseignements|informations|documents|pièces)/i, /gelieve (?:ons )?(?:de volgende )?(?:documenten|stukken)/i, /veuillez nous (?:faire parvenir|transmettre|envoyer)/i, /ontbrekende (?:documenten|stukken)|pièces manquantes/i] },
    {
      id: 'termination', type: 'termination', local: 'Opzegging / Congé', name: 'End of contract', about: 'Someone ends a contract with you — for example your landlord ends the rental contract.', urgency: 'high', objection: false, patterns: [/opzeg(?:ging)?/i, /\bcongé(?![A-Za-zÀ-ɏ])/i, /résiliation/i, /beëindiging|fin du contrat|mettre fin/i, /huurovereenkomst (?:op te zeggen|beëindigen)/i],
      steps: ['Check the notice period and the reason. A landlord can only end a contract in certain cases and with the right notice — ask a tenants’ association.'],
    },
    {
      id: 'utility-bill', type: 'utility-bill', local: 'Afrekening / Décompte', name: 'Energy or water bill', about: 'A bill for electricity, gas or water. The yearly bill compares what you used with your advance payments.', urgency: 'medium', patterns: [/afrekening|eindafrekening/i, /décompte|facture de régularisation|facture de clôture/i, /\bkWh\b/i, /\bm³(?![A-Za-zÀ-ɏ])|\bm3\b/, /meterstand|relevé (?:de|du) compteur/i, /\bEAN\b/],
      steps: ['Check the meter readings on the bill. If they are estimated, send the real reading to your supplier.'],
    },
    { id: 'bill', type: 'bill', local: 'Factuur / Facture', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bfactuur\b/i, /\bfacture\b/i, /vervaldag|vervaldatum|date d['’]échéance|(?<![A-Za-zÀ-ɏ])échéance\b/i, /te betalen bedrag|montant à payer/i, /\bnota\b|\bnote d['’]honoraires\b/i] },
  ],
  references: referencesIn('nl'),
  glossary: [
    { term: 'aanslagbiljet', slug: 'aanslagbiljet', language: 'nl', pattern: /aanslagbiljet/i, meaning: 'Tax bill. It shows how much income tax or property tax you must pay, or get back, for one year.', tip: 'You have 6 months to object, counted from the third working day after the sending date.' },
    { term: 'bezwaarschrift', slug: 'bezwaarschrift', language: 'nl', pattern: /bezwaarschrift/i, meaning: 'Written objection against a tax bill. You can send it online in MyMinfin or by post.', tip: 'Mention your name, address, the article number and tax year, and sign it.' },
    { term: 'aanslagjaar', slug: 'aanslagjaar', language: 'nl', pattern: /aanslagjaar/i, meaning: 'Tax year. Aanslagjaar 2026 is about the income you earned in 2025.' },
    { term: 'personenbelasting', slug: 'personenbelasting', language: 'nl', pattern: /personenbelasting/i, meaning: 'Personal income tax.' },
    { term: 'onroerende voorheffing', slug: 'onroerende-voorheffing', language: 'nl', pattern: /onroerende voorheffing/i, meaning: 'Yearly property tax for the owner of a house or flat.' },
    { term: 'gestructureerde mededeling', slug: 'gestructureerde-mededeling', language: 'nl', pattern: /gestructureerde mededeling/i, meaning: 'Payment code like +++123/4567/89002+++. It links your payment to your file.', tip: 'Copy it exactly into the communication field of your transfer.' },
    { term: 'rijksregisternummer', slug: 'rijksregisternummer', language: 'nl', pattern: /rijksregisternummer|\bINSZ\b/i, meaning: 'National register number. Your personal number in Belgium, also on your identity card.' },
    { term: 'OCMW', slug: 'ocmw', language: 'nl', pattern: /\bOCMW\b/, meaning: 'Public social welfare centre in your town. It helps with money, debt and housing problems.' },
    { term: 'leefloon', slug: 'leefloon', language: 'nl', pattern: /leefloon/i, meaning: 'Living wage from the OCMW for people with no or too little income.' },
    { term: 'werkloosheidsuitkering', slug: 'werkloosheidsuitkering', language: 'nl', pattern: /werkloosheidsuitkering/i, meaning: 'Unemployment benefit, decided by the RVA and paid by your union or the HVW.' },
    { term: 'arbeidsrechtbank', slug: 'arbeidsrechtbank', language: 'nl', pattern: /arbeidsrechtbank/i, meaning: 'Labour court. You can appeal social security decisions there, usually within 3 months and for free.' },
    { term: 'ziekenfonds', slug: 'ziekenfonds', language: 'nl', pattern: /ziekenfonds|mutualiteit/i, meaning: 'Health insurance fund. It pays back medical costs and pays sickness benefits.' },
    { term: 'Groeipakket', slug: 'groeipakket', language: 'nl', pattern: /groeipakket/i, meaning: 'Child benefit in Flanders.' },
    { term: 'terugvordering', slug: 'terugvordering', language: 'nl', pattern: /terugvordering/i, meaning: 'Request to pay back money you got but weren’t entitled to.', tip: 'Check how they worked it out. You can appeal, or ask to pay in parts.' },
    { term: 'gerechtsdeurwaarder', slug: 'gerechtsdeurwaarder', language: 'nl', pattern: /gerechtsdeurwaarder/i, meaning: 'Bailiff. A legal officer who delivers court papers and collects debts.' },
    { term: 'bevel tot betalen', slug: 'bevel-tot-betalen', language: 'nl', pattern: /bevel tot betalen/i, meaning: 'Formal order from a bailiff to pay a debt. After it, your goods or money can be seized.' },
    { term: 'beslag', slug: 'beslag', language: 'nl', pattern: /\bbeslag/i, meaning: 'Seizure of money or goods to pay a debt, for example part of your wage.' },
    { term: 'dagvaarding', slug: 'dagvaarding', language: 'nl', pattern: /dagvaarding/i, meaning: 'Summons to appear in court on a set date.' },
    { term: 'vredegerecht', slug: 'vredegerecht', language: 'nl', pattern: /vredegerecht|vrederechter/i, meaning: 'Local court for rent, small debts and neighbour problems.' },
    { term: 'ingebrekestelling', slug: 'ingebrekestelling', language: 'nl', pattern: /ingebrekestelling/i, meaning: 'Formal demand to pay or act. The last step before court.' },
    { term: 'aanmaning', slug: 'aanmaning', language: 'nl', pattern: /aanmaning/i, meaning: 'Payment reminder.' },
    { term: 'afbetalingsplan', slug: 'afbetalingsplan', language: 'nl', pattern: /afbetalingsplan/i, meaning: 'Payment plan to pay a debt in monthly parts.' },
    { term: 'GAS-boete', slug: 'gas-boete', language: 'nl', pattern: /GAS-?boete|gemeentelijke administratieve sanctie/i, meaning: 'Fine from the town hall, for example for parking, litter or noise.' },
    { term: 'onmiddellijke inning', slug: 'onmiddellijke-inning', language: 'nl', pattern: /onmiddellijke inning/i, meaning: 'Offer to pay a traffic fine quickly and end the case.' },
    { term: 'aangetekende brief', slug: 'aangetekende-brief', language: 'nl', pattern: /aangetekend/i, meaning: 'Registered letter. You get proof that you sent it.' },
    { term: 'huurwaarborg', slug: 'huurwaarborg', language: 'nl', pattern: /huurwaarborg/i, meaning: 'Rental deposit, usually on a blocked bank account in your name.' },
    { term: 'bevel om het grondgebied te verlaten', slug: 'bevel-om-het-grondgebied-te-verlaten', language: 'nl', pattern: /bevel om het grondgebied te verlaten/i, meaning: 'Order to leave Belgium by a set date.', tip: 'Get legal help right away — appeal deadlines are short.' },
    { term: 'avertissement-extrait de rôle', slug: 'avertissement-extrait-de-role', language: 'fr', pattern: /avertissement-extrait de rôle|\bAER\b/i, meaning: 'Tax bill. It shows how much income tax or property tax you must pay, or get back, for one year.', tip: 'You have 6 months to object, counted from the third working day after the sending date.' },
    { term: 'réclamation', slug: 'reclamation', language: 'fr', pattern: /réclamation/i, meaning: 'Written objection against a tax bill. You can send it online in MyMinfin or by post.', tip: 'Mention your name, address, the article number and tax year, and sign it.' },
    { term: 'exercice d’imposition', slug: 'exercice-d-imposition', language: 'fr', pattern: /exercice d['’]imposition/i, meaning: 'Tax year. Exercice d’imposition 2026 is about the income you earned in 2025.' },
    { term: 'précompte immobilier', slug: 'precompte-immobilier', language: 'fr', pattern: /précompte immobilier/i, meaning: 'Yearly property tax for the owner of a house or flat.' },
    { term: 'communication structurée', slug: 'communication-structuree', language: 'fr', pattern: /communication structurée/i, meaning: 'Payment code like +++123/4567/89002+++. It links your payment to your file.', tip: 'Copy it exactly into the communication field of your transfer.' },
    { term: 'numéro de registre national', slug: 'numero-de-registre-national', language: 'fr', pattern: /registre national|\bNISS\b/i, meaning: 'National register number. Your personal number in Belgium, also on your identity card.' },
    { term: 'CPAS', slug: 'cpas', language: 'fr', pattern: /\bCPAS\b/, meaning: 'Public social welfare centre in your town. It helps with money, debt and housing problems.' },
    { term: 'revenu d’intégration', slug: 'revenu-d-integration', language: 'fr', pattern: /revenu d['’]intégration/i, meaning: 'Living wage from the CPAS for people with no or too little income.' },
    { term: 'allocations de chômage', slug: 'allocations-de-chomage', language: 'fr', pattern: /allocations? de chômage/i, meaning: 'Unemployment benefit, decided by the ONEM and paid by your union or the CAPAC.' },
    { term: 'tribunal du travail', slug: 'tribunal-du-travail', language: 'fr', pattern: /tribunal du travail/i, meaning: 'Labour court. You can appeal social security decisions there, usually within 3 months and for free.' },
    { term: 'mutualité', slug: 'mutualite', language: 'fr', pattern: /mutualité|mutuelle/i, meaning: 'Health insurance fund. It pays back medical costs and pays sickness benefits.' },
    { term: 'indu', slug: 'indu', language: 'fr', pattern: /\bindu(?:ment)?\b|récupération/i, meaning: 'Money paid to you by mistake that they want back.', tip: 'Check how they worked it out. You can appeal, or ask to pay in parts.' },
    { term: 'huissier de justice', slug: 'huissier-de-justice', language: 'fr', pattern: /huissier/i, meaning: 'Bailiff. A legal officer who delivers court papers and collects debts.' },
    { term: 'commandement de payer', slug: 'commandement-de-payer', language: 'fr', pattern: /commandement de payer/i, meaning: 'Formal order from a bailiff to pay a debt. After it, your goods or money can be seized.' },
    { term: 'saisie', slug: 'saisie', language: 'fr', pattern: /\bsaisie/i, meaning: 'Seizure of money or goods to pay a debt, for example part of your wage.' },
    { term: 'citation', slug: 'citation', language: 'fr', pattern: /\bcitation\b/i, meaning: 'Summons to appear in court on a set date.' },
    { term: 'justice de paix', slug: 'justice-de-paix', language: 'fr', pattern: /justice de paix|juge de paix/i, meaning: 'Local court for rent, small debts and neighbour problems.' },
    { term: 'mise en demeure', slug: 'mise-en-demeure', language: 'fr', pattern: /mise en demeure/i, meaning: 'Formal demand to pay or act. The last step before court.' },
    { term: 'plan de paiement', slug: 'plan-de-paiement', language: 'fr', pattern: /plan de paiement|plan d['’]apurement/i, meaning: 'Payment plan to pay a debt in monthly parts.' },
    { term: 'amende administrative (SAC)', slug: 'amende-administrative-sac', language: 'fr', pattern: /amende administrative|\bSAC\b/i, meaning: 'Fine from the town hall, for example for parking, litter or noise.' },
    { term: 'perception immédiate', slug: 'perception-immediate', language: 'fr', pattern: /perception immédiate/i, meaning: 'Offer to pay a traffic fine quickly and end the case.' },
    { term: 'endéans', slug: 'endeans', language: 'fr', pattern: /\bendéans\b/i, meaning: 'Belgian French for “within”, as in “endéans les 15 jours” — within 15 days.' },
    { term: 'ordre de quitter le territoire', slug: 'ordre-de-quitter-le-territoire', language: 'fr', pattern: /ordre de quitter le territoire|\bOQT\b/i, meaning: 'Order to leave Belgium by a set date.', tip: 'Get legal help right away — appeal deadlines are short.' },
  ],
  replies: {
    objection: {
      subject: (term, of) => `Betreft: ${term} tegen uw beslissing ${of}`,
      body: (term, of) => [
        `Hierbij dien ik ${term === 'bezwaarschrift' ? 'een bezwaarschrift' : term} in tegen uw beslissing ${of}.`,
        '',
        'Reden: [Leg in een paar zinnen uit waarom de beslissing niet klopt.]',
        '',
        'Ik vraag u de beslissing te herzien en mij de ontvangst van deze brief te bevestigen.',
      ],
    },
    instalments: {
      subject: 'Betreft: Vraag om een afbetalingsplan',
      body: (of, amount) => [
        `In uw brief ${of} vraagt u mij ${amount ?? '[bedrag]'} te betalen.`,
        'Helaas kan ik dit bedrag niet in één keer betalen.',
        '',
        'Ik stel voor om het bedrag in maandelijkse schijven van [bedrag] te betalen, vanaf [datum].',
        '',
        'Graag hoor ik of u hiermee akkoord gaat.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'tax-objection',
      title: 'Object to the tax bill (bezwaarschrift)',
      advice: 'Use this if you think your tax bill is wrong. Send it within 6 months from the third working day after the sending date — online in MyMinfin, or by post to the address on the tax bill. Objecting doesn’t pause the payment.',
      english: 'I object to the tax bill for tax year [year], article number [number]. Reason: [your reason]. Please confirm that you received my objection.',
      subject: 'Betreft: Bezwaarschrift tegen het aanslagbiljet',
      body: (result) => [
        `Hierbij dien ik een bezwaarschrift in tegen het aanslagbiljet ${vanBrief(result)}.`,
        `Artikelnummer: ${reference(result, 'Tax article number') ?? '[artikelnummer]'}`,
        'Aanslagjaar: [aanslagjaar]',
        '',
        'Reden: [Leg uit wat er volgens u niet klopt, bijvoorbeeld een vergeten aftrek of een fout bedrag.]',
        '',
        '[In bijlage stuur ik de bewijsstukken.]',
        '',
        'Ik vraag u de aanslag te verminderen en mij de ontvangst van dit bezwaarschrift te bevestigen.',
      ],
      when: (result) => result.kind?.id === 'tax-bill',
      replaces: 'objection',
    },
    {
      id: 'dispute',
      title: 'Dispute the invoice or debt (betwisting)',
      advice: 'Use this if you think the invoice or debt is wrong or not yours. Send it by registered post and keep a copy. Ask them to stop collecting until they reply.',
      english: 'I dispute this invoice or debt. Reason: [your reason]. Please send me proof (the contract and invoices) and stop collecting until then.',
      subject: 'Betreft: Betwisting van factuur of schuld',
      body: (result) => [
        `Ik ontving uw brief ${vanBrief(result)} over een bedrag van ${amountOf(result, 'nl-BE', '[bedrag]')}.`,
        '',
        'Ik betwist dit bedrag. Reden: [Leg uit waarom, bijvoorbeeld: ik heb al betaald / ik heb dit contract nooit gesloten / het bedrag klopt niet.]',
        '',
        'Gelieve mij de bewijsstukken (contract en facturen) te bezorgen en de invordering te schorsen tot u mij geantwoord hebt.',
        '',
        'Deze brief is geen erkenning van de schuld.',
      ],
      when: (result) => ['collection', 'energy', 'bailiff'].includes(result.sender?.id) || ['formal-notice', 'reminder', 'bill'].includes(result.kind?.id),
    },
  ],
  byLanguage: {
    fr: {
      locale: 'fr-BE',
      references: referencesIn('fr'),
      objectionDefault: 'recours',
      objection: [
        { word: 'réclamation', pattern: /réclamation/i },
        { word: 'recours', pattern: /\brecours\b/i },
        { word: 'opposition', pattern: /\bopposition\b/i },
      ],
      help: {
        debt: 'free debt help from your CPAS or a recognised debt mediation service (médiation de dettes)',
        tenant: 'a tenants’ association (Syndicat des locataires) or a free legal advice office (maison de justice)',
        instalments: 'plan de paiement',
        general: 'the CPAS, your union or health insurance fund, or a free first-line legal advice office (aide juridique de première ligne)',
      },
      replies: {
        instalments: {
          subject: 'Objet : Demande de plan de paiement',
          body: (of, amount) => [
            `Dans votre courrier ${of}, vous me demandez de payer ${amount ?? '[montant]'}.`,
            'En raison de ma situation financière, je ne peux malheureusement pas payer cette somme en une seule fois.',
            '',
            'Je vous propose de régler ce montant en mensualités de [montant], à partir du [date].',
            '',
            'Je vous remercie de bien vouloir me confirmer votre accord.',
          ],
        },
      },
      extraReplies: [
        {
          id: 'tax-objection',
          title: 'Object to the tax bill (réclamation)',
          advice: 'Use this if you think your tax bill is wrong. Send it within 6 months from the third working day after the sending date — online in MyMinfin, or by post to the address on the tax bill. Objecting doesn’t pause the payment.',
          english: 'I object to the tax bill for tax year [year], article number [number]. Reason: [your reason]. Please confirm that you received my objection.',
          subject: 'Objet : Réclamation contre l’avertissement-extrait de rôle',
          body: (result) => [
            `Par la présente, j’introduis une réclamation contre l’avertissement-extrait de rôle ${duCourrier(result)}.`,
            `Numéro d’article : ${reference(result, 'Tax article number') ?? '[numéro d’article]'}`,
            'Exercice d’imposition : [année]',
            '',
            'Motifs : [Expliquez ce qui est inexact, par exemple une déduction oubliée ou un montant erroné.]',
            '',
            '[Vous trouverez en annexe les pièces justificatives.]',
            '',
            'Je vous demande de réduire l’imposition et de m’accuser réception de la présente réclamation.',
          ],
          when: (result) => result.kind?.id === 'tax-bill',
          replaces: 'objection',
        },
        {
          id: 'dispute',
          title: 'Dispute the invoice or debt (contestation)',
          advice: 'Use this if you think the invoice or debt is wrong or not yours. Send it by registered post and keep a copy. Ask them to stop collecting until they reply.',
          english: 'I dispute this invoice or debt. Reason: [your reason]. Please send me proof (the contract and invoices) and stop collecting until then.',
          subject: 'Objet : Contestation de facture ou de dette',
          body: (result) => [
            `J’ai bien reçu votre courrier ${duCourrier(result)} concernant un montant de ${amountOf(result, 'fr-BE', '[montant]')}.`,
            '',
            'Je conteste ce montant. Motif : [Expliquez pourquoi, par exemple : j’ai déjà payé / je n’ai jamais conclu ce contrat / le montant est inexact.]',
            '',
            'Je vous prie de me transmettre les pièces justificatives (contrat et factures) et de suspendre le recouvrement jusqu’à votre réponse.',
            '',
            'Le présent courrier ne constitue pas une reconnaissance de dette.',
          ],
          when: (result) => ['collection', 'energy', 'bailiff'].includes(result.sender?.id) || ['formal-notice', 'reminder', 'bill'].includes(result.kind?.id),
        },
      ],
    },
  },
  samples: [
    {
      id: 'tax',
      title: 'FOD Financiën',
      subtitle: 'Tax bill in Dutch, with a payment code',
      build(today) {
        const sent = addDays(today, -3);
        const due = addMonths(sent, 2);
        const year = Number(today.slice(0, 4));
        return `FOD Financiën
Algemene Administratie van de Fiscaliteit
Kruidtuinlaan 50 bus 1
1000 Brussel

Verzendingsdatum: ${belgianDate(sent)}
Artikelnummer: 123.456.789
Rijksregisternummer: 85.07.30-033.28

Mevrouw Lotte Voorbeeld
Voorbeeldstraat 12
9000 Gent

AANSLAGBILJET PERSONENBELASTING
Aanslagjaar ${year} - Inkomsten ${year - 1}

Geachte mevrouw,

Hierbij ontvangt u het aanslagbiljet in de personenbelasting voor aanslagjaar ${year}. U vindt de berekening in bijlage en in MyMinfin.

Te betalen bedrag: 1.234,56 EUR
Uiterste betaaldatum: ${belgianDate(due)}

Betaal met een overschrijving op rekening BE68 5390 0754 7034 met de gestructureerde mededeling +++123/4567/89002+++.

Als u niet akkoord gaat met deze aanslag, kunt u een bezwaarschrift indienen binnen een termijn van zes maanden vanaf de derde werkdag die volgt op de verzendingsdatum van dit aanslagbiljet. U kunt dit doen via MyMinfin of per post.

Met vriendelijke groet,

De adviseur-generaal`;
      },
    },
    {
      id: 'forem',
      title: 'Le Forem',
      subtitle: 'Appointment letter in French',
      build(today) {
        const letter = addDays(today, -2);
        const appointment = nextWorkday(addDays(today, 8));
        return `Le Forem
Direction régionale de Liège
Rue de l’Exemple 25
4000 Liège

Liège, le ${frenchLongDate(letter)}
Votre référence : 2026/123456
Numéro de registre national : 90.02.15-123.45

Monsieur Karim Exemple
Rue des Exemples 7/2
4020 Liège

Convocation à un entretien

Monsieur,

Vous êtes invité à vous présenter à un entretien avec votre conseiller le ${frenchDate(appointment)} à 9h30, à l’adresse ci-dessus.

Veuillez apporter :
- cette convocation ;
- votre carte d’identité ;
- votre CV.

Si vous ne pouvez pas vous présenter, prévenez-nous au plus tard la veille de l’entretien en indiquant le motif. Si vous ne vous présentez pas sans motif valable, vos allocations de chômage peuvent être suspendues.

Veuillez agréer, Monsieur, nos salutations distinguées.

Votre conseiller`;
      },
    },
  ],
};
