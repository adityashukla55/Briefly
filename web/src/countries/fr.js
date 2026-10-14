import { addDays, addMonths, formatLocalDate, fromIso } from '../dates.js';

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function monthStart(iso) {
  return `${iso.slice(0, 7)}-01`;
}

function frenchDate(iso) {
  return formatLocalDate(iso, '/');
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function letterOf(result) {
  return result.letterDate ? `du ${frenchDate(result.letterDate)}` : 'du [JJ/MM/AAAA]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: money.currency ?? 'EUR' }).format(money.amount) : '[montant]';
}

export default {
  id: 'fr',
  slug: 'france',
  name: 'France',
  adjective: 'French',
  flag: '🇫🇷',
  language: 'fr',
  currency: 'EUR',
  decimal: ',',
  thousands: ' .',
  dateSeparator: '/',
  ibanLength: 27,
  intro: 'French offices send formal letters and often expect a written answer or a step in your online account. Most decisions can be challenged, often within 2 months — the end of the letter (voies et délais de recours) says how.',
  signals: [/\bFrance\b/i, /\.gouv\.fr\b/i, /\.fr\b/i, /\bFR\d{2}\s?\d{4}/, /\b\d{5}\s+[A-Z][A-Za-zÀ-ÿ'’-]+/, /\bCedex\b/i, /\bcaf\b/i, /\burssaf\b/i, /impots\.gouv/i, /préfecture/i, /\bameli\b/i, /\bCPAM\b/, /france travail/i, /\bmairie\b/i],
  deliveryDays: 3,
  deliveryNote: 'In France, a deadline usually starts on the day you receive the letter — for a registered letter, often the day the post first tried to deliver it. The 3 days are only an estimate, so check the envelope or the delivery notice.',
  objection: [
    { word: 'recours gracieux', pattern: /recours gracieux/i },
    { word: 'recours administratif préalable obligatoire', pattern: /recours (?:administratif )?préalable obligatoire|\bRAPO\b/i },
    { word: 'recours amiable', pattern: /recours amiable/i },
    { word: 'réclamation', pattern: /réclamation/i },
    { word: 'contestation', pattern: /contest/i },
    { word: 'recours', pattern: /recours/i },
  ],
  help: {
    debt: 'a budget advice service (Point conseil budget) or a social worker at your town hall (CCAS)',
    tenant: 'the free housing advice office (ADIL), a tenants’ association',
    instalments: 'échéancier',
    general: 'a free help desk such as France Services, a social worker, or a legal advice point (Point-justice)',
  },
  senders: [
    {
      id: 'dgfip',
      slug: 'impots',
      name: 'Tax office',
      local: 'Finances publiques (DGFiP)',
      about: 'The public finance office. It handles income tax, property tax and other taxes.',
      patterns: [/finances publiques/i, /\bDGFiP\b/i, /impots\.gouv/i, /service des impôts/i, /\bSIP\b/, /avis d['’]imp[ôo]t/i, /avis d['’]imposition/i, /impôt sur le revenu/i, /taxe foncière/i, /prélèvement à la source/i, /num[ée]ro fiscal/i],
      letters: ['Avis d’impôt sur le revenu — the result of your tax return, usually sent in summer', 'Avis de taxe foncière — the yearly tax for property owners', 'Relance or mise en demeure — you paid tax late'],
      tips: ['Most things can be done in your personal space (espace particulier) on impots.gouv.fr, including asking questions by secure message.', 'Your tax number (numéro fiscal, 13 digits) is on every notice. Use it whenever you contact them.'],
    },
    {
      id: 'tresor',
      slug: 'tresor-public',
      name: 'Public treasury (fines and public bills)',
      local: 'Trésor public / Service de gestion comptable',
      about: 'Part of the public finance office. It collects increased fines and bills from public services, like hospitals or school canteens.',
      patterns: [/trésor public/i, /tresor public/i, /centre d['’]encaissement des amendes/i, /service de gestion comptable/i, /\bSGC\b/, /amende forfaitaire majorée/i, /avis des sommes à payer/i, /comptable public/i],
      letters: ['Avis d’amende forfaitaire majorée — an unpaid fine that has gone up', 'Avis des sommes à payer — a bill from a public service, for example a hospital or school canteen', 'Saisie administrative à tiers détenteur (SATD) — they take money from your bank account or wages'],
      tips: ['Pay fines only on amendes.gouv.fr or as shown on the notice. Other websites may be scams.', 'If you can’t pay, contact them quickly and ask for a payment plan (délais de paiement).'],
    },
    {
      id: 'caf',
      slug: 'caf',
      name: 'Family benefits office',
      local: 'Caisse d’allocations familiales (CAF)',
      about: 'Pays family benefits, housing help (APL), the RSA and the prime d’activité.',
      patterns: [/\bcaf\b/i, /caisse d['’]allocations familiales/i, /caf\.fr/i, /allocataire/i, /\bAPL\b/, /aide personnalisée au logement/i, /allocation de logement/i, /prime d['’]activité/i, /\bRSA\b/, /allocations familiales/i],
      letters: ['Notification de droits — what you get and from when', 'Demande de pièces justificatives — they need documents from you', 'Notification d’indu — you were paid too much and must pay it back', 'Contrôle — they check your situation'],
      tips: ['Tell the CAF about every change (income, address, household) quickly. Late changes are the main reason for overpayments.', 'If you disagree with a decision, write to its appeals board (Commission de recours amiable). The letter says how long you have — often 2 months.'],
    },
    {
      id: 'france-travail',
      slug: 'france-travail',
      name: 'Employment agency',
      local: 'France Travail (ex Pôle emploi)',
      about: 'Pays unemployment benefit (ARE) and helps you find work. It was called Pôle emploi until 2024.',
      patterns: [/france travail/i, /francetravail\.fr/i, /pôle emploi/i, /pole emploi/i, /demandeur d['’]emploi/i, /\bARE\b/, /aide au retour à l['’]emploi/i, /actualisation/i],
      letters: ['Convocation — a required appointment with your adviser', 'Notification de droits — how much unemployment benefit you get', 'Demande de pièces — they need documents from you', 'Trop-perçu — you were paid too much'],
      tips: ['Do your monthly update (actualisation) on francetravail.fr, even if nothing changed. If you skip it, your payments can stop.', 'If you can’t come to an appointment, tell your adviser before it, with a reason.'],
    },
    {
      id: 'prefecture',
      slug: 'prefecture',
      name: 'Prefecture (residence permits)',
      local: 'Préfecture / ANEF',
      about: 'The state office in each département. It decides on residence permits. Many requests are now made online on the ANEF website.',
      patterns: [/préfecture/i, /prefecture/i, /\bpréfet/i, /\bANEF\b/, /administration numérique pour les étrangers/i, /titre de séjour/i, /carte de séjour/i, /récépissé/i, /prolongation d['’]instruction/i, /\bAGDREF\b/i, /\bOQTF\b/, /obligation de quitter le territoire/i, /(?:service|bureau|accueil) des étrangers/i],
      letters: ['Convocation — an appointment, for example to give fingerprints or collect your card', 'Récépissé or attestation de prolongation d’instruction — proof that you can stay while they decide', 'Refus de titre de séjour — your permit was refused', 'OQTF — an order to leave France'],
      tips: ['Start your renewal early, months before your permit ends. Check the exact time window on service-public.fr.', 'A refusal or an order to leave France (OQTF) can have very short deadlines. Get legal help the same day.'],
    },
    {
      id: 'ofii',
      slug: 'ofii',
      name: 'Immigration and integration office',
      local: 'OFII',
      about: 'Welcomes new residents from outside the EU. It runs the integration contract (CIR), French classes and some medical visits.',
      patterns: [/\bOFII\b/, /office français de l['’]immigration et de l['’]intégration/i, /contrat d['’]intégration républicaine/i, /\bCIR\b/, /\bVLS-TS\b/i, /formation civique/i],
      letters: ['Convocation — an appointment for training, a French test or a medical visit', 'Contrat d’intégration républicaine (CIR) — your integration contract', 'Attestation — proof that you attended the training'],
      tips: ['Go to every OFII appointment. Taking part in the training can matter when you renew your permit.'],
    },
    {
      id: 'cpam',
      slug: 'assurance-maladie',
      name: 'Health insurance',
      local: 'Assurance Maladie (CPAM)',
      about: 'The public health insurance. It pays back part of your doctor, medicine and hospital costs.',
      patterns: [/assurance maladie/i, /\bCPAM\b/, /caisse primaire d['’]assurance maladie/i, /\bameli\b/i, /carte vitale/i, /indemnités journalières/i, /complémentaire santé solidaire/i, /\bC2S\b/],
      letters: ['Attestation de droits — proof of your health cover', 'Demande de pièces — they need documents to open or keep your rights', 'Indemnités journalières — sick pay while you can’t work', 'Indu — they want money back'],
      tips: ['Open an account on ameli.fr. You can follow refunds and download documents there.', 'Ask for your Carte Vitale as soon as you have a social security number.'],
    },
    {
      id: 'mutuelle',
      slug: 'mutuelle',
      name: 'Top-up health insurance',
      local: 'Mutuelle / complémentaire santé',
      about: 'A private insurance that pays the part of health costs the Assurance Maladie doesn’t cover.',
      patterns: [/\bmutuelle/i, /complémentaire santé(?! solidaire)/i, /tiers payant/i],
      letters: ['Échéancier de cotisations — your payment schedule', 'Relance — an unpaid contribution', 'Résiliation — your contract ends'],
      tips: ['If your income is low, you may get the Complémentaire santé solidaire (C2S) for free or for a small fee. Ask on ameli.fr.'],
    },
    {
      id: 'urssaf',
      slug: 'urssaf',
      name: 'Social contributions office',
      local: 'URSSAF',
      about: 'Collects social contributions from employers and the self-employed, including micro-entrepreneurs.',
      patterns: [/urssaf/i, /cotisations sociales/i, /micro-entrepreneur/i, /auto-entrepreneur/i, /travailleur indépendant/i],
      letters: ['Échéancier — when to pay your contributions', 'Mise en demeure — unpaid contributions, a formal warning', 'Contrainte — an order to pay that works like a court decision'],
      tips: ['As a micro-entrepreneur, declare your income on time — even when it is zero.', 'If you can’t pay, ask for a payment plan (délais de paiement) in your online account before the due date.'],
    },
    {
      id: 'mairie',
      slug: 'mairie',
      name: 'Town hall',
      local: 'Mairie',
      about: 'Your local town hall. It keeps birth, marriage and other civil records (état civil) and runs local services like school sign-up.',
      patterns: [/\bmairie\b/i, /hôtel de ville/i, /état civil/i, /\bCCAS\b/, /inscription scolaire/i, /conseil municipal/i],
      letters: ['Acte d’état civil — a copy of a birth or marriage record', 'Inscription scolaire — your child’s school place', 'Facture — a bill for the canteen or after-school care'],
      tips: ['Your town hall’s social services office (CCAS) can help if you have money problems.'],
    },
    {
      id: 'antai',
      slug: 'antai',
      name: 'Traffic fines agency',
      local: 'ANTAI',
      about: 'Sends traffic and parking notices, for example from speed cameras, for the police and for towns.',
      patterns: [/\bANTAI\b/i, /agence nationale de traitement automatisé des infractions/i, /antai\.gouv/i, /amendes\.gouv/i, /avis de contravention/i, /désignation du conducteur/i, /désigner le conducteur/i, /forfait post-stationnement/i],
      letters: ['Avis de contravention — a traffic fine', 'Avis de paiement du forfait post-stationnement (FPS) — a parking charge from a town', 'Désignation du conducteur — they ask who was driving'],
      tips: ['Pay or contest only on antai.gouv.fr or amendes.gouv.fr. Other websites may charge fees or be scams.', 'A parking charge (FPS) is not a fine. To contest it, you usually first send a RAPO within 1 month, as the notice explains.'],
    },
    {
      id: 'commissaire',
      slug: 'commissaire-de-justice',
      name: 'Bailiff',
      local: 'Commissaire de justice (ex huissier)',
      about: 'A legal officer who delivers court papers and collects debts, sometimes by force. They replaced the huissiers in 2022.',
      patterns: [/commissaire de justice/i, /commissaires de justice/i, /huissier/i, /\bsignification/i, /procès-verbal de saisie/i],
      letters: ['Commandement de payer — a formal order to pay', 'Signification — official delivery of a court decision or other legal paper', 'Procès-verbal de saisie — a record of money or things seized'],
      tips: ['Never ignore their letters. Check what the debt is for, and call them to agree a payment plan.', 'Your bank must always leave you a basic amount (solde bancaire insaisissable), even after a seizure.'],
    },
    {
      id: 'tribunal',
      slug: 'tribunal',
      name: 'Court',
      local: 'Tribunal',
      about: 'A court. Letters from a court are always important — never ignore them.',
      patterns: [/tribunal (?:judiciaire|administratif|de police|de proximité|de commerce)/i, /cour d['’]appel/i, /\bgreffe\b/i, /\bjugement\b/i, /injonction de payer/i, /convocation à l['’]audience/i],
      letters: ['Convocation à l’audience — you must come to a hearing', 'Jugement — the court’s decision', 'Ordonnance portant injonction de payer — a court order to pay'],
      tips: ['Court deadlines are strict and short. Get free legal advice quickly, for example at a Point-justice.', 'If your income is low, you can ask for legal aid (aide juridictionnelle) to pay for a lawyer.'],
    },
    {
      id: 'bailleur',
      slug: 'bailleur',
      name: 'Landlord or letting agency',
      local: 'Bailleur / agence immobilière',
      about: 'The owner of your flat, or the agency or social housing body (HLM) that manages it.',
      patterns: [/\bbailleur/i, /agence immobilière/i, /gestion locative/i, /\blocataire/i, /\bloyer/i, /\bbail\b/i, /\bHLM\b/, /office public de l['’]habitat/i, /quittance/i, /dépôt de garantie/i, /état des lieux/i, /charges locatives/i],
      letters: ['Avis d’échéance or quittance de loyer — rent due or rent receipt', 'Régularisation des charges — the yearly bill for shared costs', 'Congé — notice to end your lease'],
      tips: ['Your landlord must return the deposit (dépôt de garantie) within 1 month if the move-out check matches the move-in check, or within 2 months if not.', 'The free housing advice office (ADIL) can check rent increases, charges and notices.'],
    },
    {
      id: 'energie',
      slug: 'fournisseur-energie',
      name: 'Energy supplier',
      local: 'Fournisseur d’énergie (EDF, Engie…)',
      about: 'The company that sells you electricity or gas.',
      patterns: [/\bEDF\b/, /\bengie\b/i, /totalenergies/i, /fournisseur d['’](?:énergie|électricité|gaz)/i, /\bkWh\b/i, /relevé de compteur/i, /\bLinky\b/i, /point de livraison/i, /électricité/i],
      letters: ['Facture — your bill', 'Échéancier — your monthly payments for the year', 'Facture de régularisation — the yearly bill after a meter reading', 'Relance — an unpaid bill'],
      tips: ['From 1 November to 31 March (trêve hivernale), suppliers usually can’t cut off your energy for unpaid bills. Still, call them early and ask for a payment plan.', 'If your income is low, you may get the chèque énergie to help pay your bills.'],
    },
    {
      id: 'retraite',
      slug: 'assurance-retraite',
      name: 'Pension office',
      local: 'Assurance retraite (CNAV / Carsat)',
      about: 'Runs the basic state pension for most private-sector workers. Your work years are recorded here.',
      patterns: [/assurance retraite/i, /\bCNAV\b/i, /\bcarsat\b/i, /lassuranceretraite\.fr/i, /relevé de carrière/i, /retraite de base/i, /estimation indicative globale/i],
      letters: ['Relevé de carrière — the list of your work years', 'Estimation indicative globale — a forecast of your pension', 'Notification de retraite — how much pension you get'],
      tips: ['Check that all your work years, including jobs abroad, are on your record. You can see it online at info-retraite.fr.'],
    },
  ],
  kinds: [
    {
      id: 'saisie', type: 'enforcement', local: 'Saisie / commandement de payer', name: 'Enforcement notice', about: 'They are about to take money by force, for example from your bank account or your wages.', urgency: 'high', patterns: [/commandement de payer/i, /\bsaisie/i, /\bSATD\b/, /tiers détenteur/i, /exécution forcée/i, /procès-verbal de saisie/i],
      steps: ['Your bank must always leave you a basic amount (solde bancaire insaisissable), even after a seizure. Ask your bank if it is missing.'],
    },
    {
      id: 'injonction', type: 'court-order', local: 'Injonction de payer / contrainte', name: 'Court payment order', about: 'An order to pay that works like a court decision. If you don’t owe the money, you must object fast — often within 15 days or 1 month. Check the letter.', urgency: 'high', patterns: [/injonction de payer/i, /ordonnance portant injonction/i, /\bcontrainte\b/i],
      steps: ['If you really owe this money, pay it or ask for a payment plan.', 'If you don’t owe it, file an objection (opposition) before the deadline in the letter. Get legal advice quickly, for example at a Point-justice.'],
    },
    {
      id: 'mise-en-demeure', type: 'reminder', local: 'Mise en demeure', name: 'Formal demand', about: 'A formal last warning. If you don’t pay or act by the date given, they can take legal steps.', urgency: 'high', patterns: [/mise en demeure/i, /mettons en demeure/i, /met en demeure/i, /dernier avis avant/i],
      steps: ['If you disagree, answer by registered letter with proof of receipt (lettre recommandée avec accusé de réception), so you can prove it.'],
    },
    { id: 'relance', type: 'reminder', local: 'Relance / rappel', name: 'Payment reminder', about: 'You have not paid something on time. Extra fees may be added if you wait longer.', urgency: 'high', patterns: [/\brelance/i, /lettre de rappel/i, /dernier rappel/i, /rappel de paiement/i, /\bimpayée?s?\b/i, /retard de paiement/i, /sauf erreur de notre part/i, /n['’]avons pas (?:encore )?reçu (?:votre|le) (?:paiement|règlement)/i] },
    {
      id: 'contravention', type: 'fine', local: 'Avis de contravention', name: 'Fine', about: 'A fine, for example for speeding. Paying quickly is often cheaper, and waiting too long makes it more expensive. You can usually contest it within 45 days.', urgency: 'high', patterns: [/avis de contravention/i, /amende forfaitaire(?!\s+majorée)/i, /\bcontravention/i],
      steps: ['If you were not driving, you can usually name the driver on antai.gouv.fr instead of paying.', 'To contest, follow the steps in the letter, usually on antai.gouv.fr. Paying the fine usually means you accept it.'],
    },
    {
      id: 'majoree', type: 'fine', local: 'Amende forfaitaire majorée', name: 'Increased fine', about: 'A fine that has gone up because it was not paid or contested in time. If you don’t pay, money can be taken from your bank account or wages.', urgency: 'high', patterns: [/amende forfaitaire majorée/i, /amende majorée/i, /avis d['’]amende forfaitaire majorée/i],
      steps: ['Pay it, or send a complaint (réclamation) as the letter explains — usually within 3 months. If you never got the first notice, say so.'],
    },
    {
      id: 'impot', type: 'tax-assessment', local: 'Avis d’imposition', name: 'Tax notice', about: 'The result of your tax return. It shows how much tax you owe, or if you get money back.', urgency: 'medium', patterns: [/avis d['’]imp[ôo]t/i, /avis d['’]imposition/i, /impôt sur le revenu/i, /taxe foncière/i, /taxe d['’]habitation/i, /revenu fiscal de référence/i],
      steps: ['Check your income, family situation and the amounts. If something is wrong, you can correct it or send a complaint (réclamation) in your personal space on impots.gouv.fr.'],
    },
    {
      id: 'indu', type: 'repayment', local: 'Indu / trop-perçu', name: 'Request to pay money back', about: 'They believe they paid you too much and want the money back. Often they take it from your future payments.', urgency: 'high', patterns: [/notification d['’]indu/i, /\bindu\b/i, /trop[- ]perçu/i, /perçue?s? à tort/i, /versée?s? à tort/i, /vous devez rembourser/i, /remboursement de la somme/i],
      steps: ['Check the period and the amount. If you don’t understand them, ask the office to explain how they worked it out.', 'If your situation is very hard, you can ask for a debt write-off (remise de dette). There is a ready-made letter below.'],
    },
    {
      id: 'convocation', type: 'appointment', local: 'Convocation / rendez-vous', name: 'Appointment', about: 'They want you to come to an appointment. Missing it without a good reason can have consequences, for example less money or a delay in your file.', urgency: 'medium', patterns: [/convocation/i, /\bconvoqu/i, /rendez-vous/i, /vous présenter (?:le|à|au|en)/i, /invitée? à vous présenter/i, /entretien (?:individuel|de suivi|avec)/i, /\baudience/i],
      steps: ['Bring every document listed in the letter, and arrive a little early.'],
    },
    { id: 'pieces', type: 'documents', local: 'Demande de pièces justificatives', name: 'Request for documents', about: 'They need papers or information from you before they can decide.', urgency: 'medium', patterns: [/pièces? justificatives?/i, /pièces? manquantes?/i, /documents? manquants?/i, /dossier (?:est )?incomplet/i, /compléter votre dossier/i, /merci de nous (?:faire parvenir|transmettre|adresser|retourner)/i, /(?:demandons|remercions) de (?:bien vouloir )?nous (?:faire parvenir|transmettre|adresser|fournir)/i] },
    {
      id: 'refus', type: 'rejection', local: 'Refus / rejet', name: 'Rejection', about: 'Your request was turned down. You can usually challenge it — the end of the letter says how and by when.', urgency: 'medium', patterns: [/décision de refus/i, /\brefus\b/i, /\brefusons/i, /est refusée?/i, /\brejet/i, /avis défavorable/i, /ne pouvons (?:pas )?(?:donner une suite favorable|accéder|faire droit)/i, /irrecevable/i],
      steps: ['Read the end of the letter (voies et délais de recours). It says where to send a challenge and how long you have — often 2 months, but sometimes much less.'],
    },
    { id: 'droits', type: 'approval', local: 'Notification de droits / attribution', name: 'Approval', about: 'Your request was accepted. The letter shows what you get, how much and from when.', urgency: 'low', patterns: [/notification de droits?/i, /ouverture de (?:vos |votre )?droits?/i, /vos droits (?:sont|ont été) (?:ouverts|accordés|renouvelés)/i, /nous vous (?:accordons|attribuons)/i, /(?:décision|notification) d['’]attribution/i, /avis favorable/i, /votre demande (?:est|a été) acceptée/i, /vous avez droit à/i] },
    {
      id: 'resiliation', type: 'termination', local: 'Résiliation / congé', name: 'Termination notice', about: 'A contract is being ended, for example your lease, your job, an insurance or a phone contract.', urgency: 'high', patterns: [/résiliation/i, /\brésilier/i, /congé pour (?:vente|reprise|motif)/i, /donn(?:er|ons) congé/i, /lettre de congé/i, /fin de (?:votre )?contrat/i, /licenciement/i],
      steps: ['If your landlord is ending your lease: they usually must give notice at least 6 months before the lease ends (3 months if furnished), and only for set reasons. Ask the ADIL for free advice.'],
    },
    {
      id: 'charges', type: 'utility-bill', local: 'Régularisation des charges', name: 'Yearly service charge bill', about: 'Your landlord’s yearly bill for shared costs, like water, heating or cleaning. You may pay extra or get money back.', urgency: 'medium', patterns: [/régularisation (?:annuelle )?des charges/i, /décompte (?:annuel )?(?:des|de) charges/i, /charges locatives/i, /provisions? (?:pour|sur) charges/i],
      steps: ['Compare it with the monthly charges (provisions) you already paid. You can ask to see the receipts (pièces justificatives).'],
    },
    { id: 'facture', type: 'bill', local: 'Facture / échéancier', name: 'Bill', about: 'A bill or a payment schedule. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bfacture/i, /votre échéancier/i, /avis d['’]échéance/i, /avis des sommes à payer/i] },
    { id: 'decision', type: 'decision', local: 'Décision', name: 'Official decision', about: 'A formal decision by an office. It becomes final if you don’t challenge it in time.', urgency: 'medium', weight: 0.4, patterns: [/\bdécision/i] },
  ],
  references: [
    { name: 'Tax number', local: 'Numéro fiscal', pattern: /(?:num[ée]ro fiscal|n°\s?fiscal|identifiant fiscal)/gi },
    { name: 'Tax notice reference', local: 'Référence de l’avis', pattern: /(?:référence de l['’]avis|référence avis)/gi },
    { name: 'Claimant number', local: 'Numéro allocataire', pattern: /(?:num[ée]ro (?:d['’])?allocataire|n°\s?(?:d['’])?allocataire|matricule allocataire)/gi },
    { name: 'Social security number', local: 'Numéro de sécurité sociale', personal: true, pattern: /(?:num[ée]ro de sécurité sociale|n°\s?de sécurité sociale|num[ée]ro d['’]immatriculation|\bNIR\b)/gi },
    { name: 'Job seeker number', local: 'Identifiant France Travail', pattern: /(?:identifiant (?:france travail|pôle emploi)|identifiant demandeur d['’]emploi)/gi },
    { name: 'Foreigner number', local: 'Numéro étranger', pattern: /(?:num[ée]ro (?:étranger|d['’]étranger|AGDREF)|n°\s?(?:étranger|AGDREF))/gi },
    { name: 'Case number', local: 'Numéro de dossier', pattern: /(?:num[ée]ro de dossier|n°\s?de dossier|dossier n°|référence du dossier)/gi },
    { name: 'Fine notice number', local: 'Numéro d’avis de contravention', pattern: /(?:num[ée]ro (?:de l['’])?avis de contravention|n°\s?(?:de l['’])?avis de contravention|num[ée]ro d['’]avis)/gi },
    { name: 'Online payment number', local: 'Numéro de télépaiement', payment: true, pattern: /(?:num[ée]ro de télépaiement|n°\s?de télépaiement)/gi },
    { name: 'Payment reference', local: 'Référence de paiement', payment: true, pattern: /(?:référence de paiement|référence du virement|libellé du virement|motif du virement)/gi },
    { name: 'Customer number', local: 'Numéro client', pattern: /(?:num[ée]ro (?:de )?client|n°\s?(?:de )?client|référence client)/gi },
    { name: 'Invoice number', local: 'Numéro de facture', pattern: /(?:num[ée]ro de facture|n°\s?de facture|facture n°)/gi },
  ],
  glossary: [
    { term: 'avis d’imposition', slug: 'avis-d-imposition', pattern: /avis d['’]imp[ôo](?:t|sition)/i, meaning: 'Tax notice. It shows how much tax you owe or get back.', tip: 'Keep it safe. You often need it as proof of income, for example to rent a flat or get benefits.' },
    { term: 'prélèvement à la source', slug: 'prelevement-a-la-source', pattern: /prélèvement à la source/i, meaning: 'Income tax taken directly from your salary or pension every month.' },
    { term: 'numéro fiscal', slug: 'numero-fiscal', pattern: /num[ée]ro fiscal|identifiant fiscal/i, meaning: 'Your personal 13-digit tax number. It never changes.', tip: 'Write it on every letter to the tax office. You also need it to open your account on impots.gouv.fr.' },
    { term: 'taxe foncière', slug: 'taxe-fonciere', pattern: /taxe foncière/i, meaning: 'Yearly local tax paid by people who own a property.' },
    { term: 'date limite de paiement', slug: 'date-limite-de-paiement', pattern: /date limite de paiement/i, meaning: 'The last day to pay.' },
    { term: 'majoration', slug: 'majoration', pattern: /majoration|majorée/i, meaning: 'Extra charge added because you paid or acted late.' },
    { term: 'mise en demeure', slug: 'mise-en-demeure', pattern: /mise en demeure|mettons en demeure/i, meaning: 'Formal demand. A last warning before legal action.', tip: 'Don’t ignore it. Pay, or answer in writing before the date given — by registered letter if you disagree.' },
    { term: 'relance', slug: 'relance', pattern: /\brelance/i, meaning: 'Reminder. You have not paid or answered yet.' },
    { term: 'recours gracieux', slug: 'recours-gracieux', pattern: /recours gracieux/i, meaning: 'A request to the same office to change its decision.', tip: 'Send it in writing before the deadline and keep proof that you sent it, for example by registered letter.' },
    { term: 'RAPO', slug: 'rapo', pattern: /recours (?:administratif )?préalable obligatoire|\bRAPO\b/i, meaning: 'Required first appeal (recours administratif préalable obligatoire). You must send it to the office before you can go to court.', tip: 'If the letter mentions a RAPO, you can’t go straight to court. Send the RAPO first, before the deadline.' },
    { term: 'recours amiable', slug: 'recours-amiable', pattern: /recours amiable/i, meaning: 'A first appeal to the CAF, Assurance Maladie or URSSAF. It goes to their appeals board (Commission de recours amiable, CRA).' },
    { term: 'réclamation', slug: 'reclamation', pattern: /réclamation/i, meaning: 'Complaint or formal request to change something, for example your tax.' },
    { term: 'contestation', slug: 'contestation', pattern: /contestation|contester|contestez/i, meaning: 'Challenge. Saying in writing that a decision or a fine is wrong.' },
    { term: 'voies et délais de recours', slug: 'voies-et-delais-de-recours', pattern: /voies et délais de recours|voies de recours/i, meaning: 'The part of the letter that explains how and by when you can challenge the decision.', tip: 'Read it first. It tells you where to write and how long you have.' },
    { term: 'délai', slug: 'delai', pattern: /délai/i, meaning: 'Time limit or deadline.', tip: 'If you can’t make it, ask for more time before it ends.' },
    { term: 'notification', slug: 'notification', pattern: /notification|notifiée?/i, meaning: 'Official delivery of a decision. Deadlines often start from this day.' },
    { term: 'lettre recommandée avec accusé de réception', slug: 'lettre-recommandee', pattern: /lettre recommandée|recommandé avec accusé|accusé de réception|\bLRAR\b/i, meaning: 'Registered letter with proof of delivery. Use it for important replies.', tip: 'If you were out, the post leaves a notice (avis de passage). You usually have 15 days to collect the letter at the post office.' },
    { term: 'pièces justificatives', slug: 'pieces-justificatives', pattern: /pièces? justificatives?|justificatifs?/i, meaning: 'Supporting documents, for example payslips, contracts or bills.' },
    { term: 'justificatif de domicile', slug: 'justificatif-de-domicile', pattern: /justificatif de domicile/i, meaning: 'Proof of address, for example a recent energy bill or a rent receipt.' },
    { term: 'attestation', slug: 'attestation', pattern: /attestation/i, meaning: 'Certificate or written statement, for example proof of health cover.' },
    { term: 'titre de séjour', slug: 'titre-de-sejour', pattern: /titre de séjour|carte de séjour/i, meaning: 'Residence permit.' },
    { term: 'récépissé', slug: 'recepisse', pattern: /récépissé|prolongation d['’]instruction/i, meaning: 'Paper proving that you applied. It usually lets you stay legally while they decide.' },
    { term: 'OQTF', slug: 'oqtf', pattern: /\bOQTF\b|obligation de quitter le territoire/i, meaning: 'Order to leave France (obligation de quitter le territoire français).', tip: 'The deadline to challenge it can be very short — sometimes only a few days. Get legal help immediately.' },
    { term: 'convocation', slug: 'convocation', pattern: /convocation|convoqu/i, meaning: 'Official invitation to an appointment. You are expected to come.', tip: 'If you can’t come, tell them before the date and give a reason.' },
    { term: 'allocataire', slug: 'allocataire', pattern: /allocataire/i, meaning: 'Person who gets benefits from the CAF. Your numéro allocataire is your CAF number.' },
    { term: 'indu', slug: 'indu', pattern: /\bindu\b/i, meaning: 'Money paid to you by mistake that you have to pay back.', tip: 'Check the amount and the period. You can ask for a payment plan (échéancier) or a debt write-off (remise de dette).' },
    { term: 'trop-perçu', slug: 'trop-percu', pattern: /trop[- ]perçu/i, meaning: 'Overpayment. Money you got but were not entitled to.' },
    { term: 'échéancier', slug: 'echeancier', pattern: /échéancier|délais de paiement/i, meaning: 'Payment plan or payment schedule. It shows how much to pay and when.' },
    { term: 'remise de dette', slug: 'remise-de-dette', pattern: /remise de dette|remise gracieuse/i, meaning: 'Cancelling all or part of a debt because you can’t pay it.' },
    { term: 'commissaire de justice', slug: 'commissaire-de-justice', pattern: /commissaires? de justice|huissier/i, meaning: 'Bailiff. A legal officer who delivers court papers and can seize money or goods. Until 2022 called huissier.', tip: 'Check who the debt is owed to and what it is for. You can call them to agree a payment plan.' },
    { term: 'saisie', slug: 'saisie', pattern: /\bsaisie/i, meaning: 'Seizure of money or goods to pay a debt.', tip: 'Your bank must always leave you a basic amount (solde bancaire insaisissable), equal to the RSA for one person.' },
    { term: 'commandement de payer', slug: 'commandement-de-payer', pattern: /commandement de payer/i, meaning: 'Formal order to pay, delivered by a bailiff. It often comes just before a seizure or a court case.' },
    { term: 'amende', slug: 'amende', pattern: /\bamendes?\b/i, meaning: 'Fine.' },
    { term: 'avis de contravention', slug: 'avis-de-contravention', pattern: /avis de contravention/i, meaning: 'Notice of a traffic or parking offence, with the fine to pay.' },
    { term: 'forfait post-stationnement', slug: 'forfait-post-stationnement', pattern: /forfait post-stationnement|\bFPS\b/, meaning: 'Parking charge from a town when you didn’t pay for parking. It is not a fine.' },
    { term: 'RIB', slug: 'rib', pattern: /\bRIB\b|relevé d['’]identité bancaire/i, meaning: 'Your bank details on one page (IBAN and BIC). Offices often ask for it to pay you.' },
    { term: 'virement', slug: 'virement', pattern: /virement/i, meaning: 'Bank transfer.' },
    { term: 'prélèvement', slug: 'prelevement', pattern: /prélèvement(?! à la source)/i, meaning: 'Direct debit. Money taken from your account automatically.' },
    { term: 'résiliation', slug: 'resiliation', pattern: /résiliation|résilier/i, meaning: 'Ending a contract, for example a lease, an insurance or a phone contract.' },
    { term: 'préavis', slug: 'preavis', pattern: /préavis/i, meaning: 'Notice period. The time between giving notice and the end of the contract.' },
    { term: 'congé', slug: 'conge', pattern: /\bcongé/i, meaning: 'In housing letters: notice to end the lease. In work letters: time off.' },
    { term: 'dépôt de garantie', slug: 'depot-de-garantie', pattern: /dépôt de garantie/i, meaning: 'Rental deposit.', tip: 'It must be returned within 1 month if the move-out check matches the move-in check, or within 2 months if not.' },
    { term: 'état des lieux', slug: 'etat-des-lieux', pattern: /état des lieux/i, meaning: 'Written check of the flat’s condition when you move in and when you move out.' },
    { term: 'quittance de loyer', slug: 'quittance-de-loyer', pattern: /quittance/i, meaning: 'Rent receipt.' },
    { term: 'charges locatives', slug: 'charges-locatives', pattern: /charges locatives|provisions? (?:pour|sur) charges/i, meaning: 'Service charges paid with the rent, like water, heating or cleaning of shared areas.' },
    { term: 'CSG', slug: 'csg', pattern: /\bCSG\b|\bCRDS\b/, meaning: 'Social contributions (CSG and CRDS) taken from most kinds of income.' },
    { term: 'cotisations', slug: 'cotisations', pattern: /cotisations?/i, meaning: 'Contributions you pay, for example for social security or an insurance.' },
    { term: 'actualisation', slug: 'actualisation', pattern: /actualisation/i, meaning: 'The monthly update you send to France Travail to keep getting paid.' },
    { term: 'aide juridictionnelle', slug: 'aide-juridictionnelle', pattern: /aide juridictionnelle/i, meaning: 'Legal aid. The state pays all or part of your lawyer if your income is low.' },
    { term: 'France Services', slug: 'france-services', pattern: /france services/i, meaning: 'Free local help desks. Staff help you with the CAF, the tax office, France Travail and other offices.' },
  ],
  replies: {
    objection: {
      subject: (term, of) => `Objet : ${capitalize(term)} – décision ${of}`,
      body: (term, of) => [
        `Par la présente, je conteste votre décision ${of}. Ce courrier vaut ${term}.`,
        '',
        'Motifs : [Expliquez en quelques phrases pourquoi la décision est erronée.]',
        '',
        'Je vous remercie de bien vouloir réexaminer mon dossier et de m’accuser réception de ce courrier.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'debt-relief',
      title: 'Ask to cancel or reduce the debt (remise de dette)',
      advice: 'Use this if you must pay money back but your situation is very hard. Explain your income and costs, and add proof.',
      english: 'You asked me to pay back [amount]. My financial situation is very hard because [reason]. I ask you to cancel all or part of this debt. I attach proof of my income and costs.',
      subject: 'Objet : Demande de remise de dette',
      body: (result) => [
        `Votre courrier ${letterOf(result)} me demande de rembourser la somme de ${amountOf(result)}.`,
        'Ma situation financière ne me permet pas de rembourser cette somme, car [expliquez : revenus, charges, situation familiale].',
        '',
        'Je vous demande donc de bien vouloir m’accorder une remise totale ou partielle de cette dette.',
        '',
        'Vous trouverez ci-joint les justificatifs de mes ressources et de mes charges.',
      ],
      when: (result) => result.kind?.type === 'repayment',
    },
  ],
  samples: [
    {
      id: 'caf',
      title: 'Family benefits (CAF)',
      subtitle: 'Overpayment to pay back',
      build(today) {
        const letter = addDays(today, -3);
        const due = nextWorkday(addDays(letter, 30));
        const start = addMonths(monthStart(today), -7);
        const end = addDays(addMonths(start, 4), -1);
        return `Caf du Rhône
Caisse d’allocations familiales
12 rue de l’Exemple · 69003 Lyon

Madame Ana Exemplo
8 rue des Lilas
69007 Lyon

Numéro allocataire : 1234567
Lyon, le ${frenchDate(letter)}

Objet : Notification d’indu – aide personnalisée au logement (APL)

Madame,

Après réexamen de votre dossier, nous avons constaté que vous avez reçu trop d’aide au logement pour la période du ${frenchDate(start)} au ${frenchDate(end)}. Vos ressources ont changé et ce changement ne nous a pas été signalé à temps.

Détail de l’indu
Aide personnalisée au logement (APL) versée à tort : 4 mois × 308,64 €
Montant total de l’indu : 1 234,56 €

Merci de régler cette somme avant le ${frenchDate(due)} :
- en ligne, dans votre Espace Mon Compte sur caf.fr ;
- ou par virement sur le compte suivant :
Titulaire du compte : Caf du Rhône
IBAN : FR76 3000 6000 0112 3456 7890 189
BIC : AGRIFRPPXXX
Référence de paiement : 1234567 IND

Sans paiement de votre part avant cette date, nous récupérerons cette somme par des retenues sur vos prochaines prestations.

Si vous ne pouvez pas rembourser en une seule fois, vous pouvez demander un échéancier. Si votre situation financière est difficile, vous pouvez aussi demander une remise de dette.

Voies et délais de recours
Si vous contestez cette décision, vous pouvez saisir la Commission de recours amiable (CRA) de la Caf du Rhône, par écrit, dans un délai de deux mois à compter de la notification de cette décision.

Veuillez agréer, Madame, l’expression de nos salutations distinguées.

Votre Caf du Rhône`;
      },
    },
    {
      id: 'prefecture',
      title: 'Prefecture',
      subtitle: 'Appointment to collect your residence permit',
      build(today) {
        const letter = addDays(today, -2);
        const appointment = nextWorkday(addDays(today, 8));
        return `PRÉFECTURE DU RHÔNE
Direction des migrations et de l’intégration
Bureau des titres de séjour
1 place de l’Exemple · 69003 Lyon

Monsieur Rahul Exemple
5 avenue des Tilleuls
69100 Villeurbanne

Numéro étranger : 6901234567
Numéro de dossier : 2026-069-012345
Lyon, le ${frenchDate(letter)}

Objet : Convocation pour la remise de votre titre de séjour

Monsieur,

Votre titre de séjour est disponible. Vous êtes convoqué le ${frenchDate(appointment)} à 9h30 à la préfecture du Rhône, accueil des étrangers, guichet 4.

Merci de vous présenter en personne, avec les documents suivants :
- cette convocation ;
- votre passeport en cours de validité ;
- votre récépissé ou votre attestation de prolongation d’instruction ;
- les timbres fiscaux correspondant à votre titre, achetés sur timbres.impots.gouv.fr.

Le titre ne peut être remis qu’à vous-même. Si vous ne pouvez pas venir à ce rendez-vous, prévenez-nous au plus tôt depuis votre compte ANEF.

Veuillez agréer, Monsieur, l’expression de mes salutations distinguées.

Pour le préfet et par délégation,
Le chef du bureau des titres de séjour`;
      },
    },
  ],
};
