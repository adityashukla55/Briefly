import { addDays, formatLocalDate, fromIso } from '../dates.js';

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

const d = (iso) => formatLocalDate(iso, '/');

export default {
  id: 'it',
  slug: 'italy',
  name: 'Italy',
  adjective: 'Italian',
  flag: '🇮🇹',
  language: 'it',
  currency: 'EUR',
  decimal: ',',
  thousands: '.',
  dateSeparator: '/',
  ibanLength: 27,
  intro: 'Italian offices often send important letters by registered mail (raccomandata) or by certified email (PEC). Deadlines usually start when the letter counts as delivered (notifica), so collect registered letters quickly and keep the envelope.',
  signals: [/\bItalia\b/i, /\.gov\.it\b/i, /\.it\b/i, /\bIT\d{2}\s?[A-Z]\d{3}/, /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/, /agenzia (?:delle )?entrate/i, /\bINPS\b/, /\bcomune di\b/i, /pago\s?pa/i, /\b\d{5}\s+[A-Z][a-zàèéìòù]+(?:\s+[A-Z][a-zàèéìòù]+)*\s+\(?[A-Z]{2}\)?(?![a-z])/],
  deliveryDays: 3,
  deliveryNote: 'In Italy, deadlines usually run from the day the letter counts as delivered (notifica). For registered mail, that is the day you sign for it — or, if you don’t collect it, a set time after the post office leaves a notice. Our estimate adds 3 days to the date on the letter, so check the real date.',
  objectionAdvice: 'Use this for a written appeal (ricorso) to the office named in the letter, for example the Prefetto for a fine. Tax appeals go to the tax court (Corte di giustizia tributaria) — for larger amounts you usually need a tax adviser or lawyer. Send it before the deadline.',
  objection: [
    { word: 'ricorso', pattern: /(?<!(?:visto|letto) il )\bricorso\b(?! per (?:decreto )?ingiun)/i },
    { word: 'opposizione', pattern: /\bopposizione\b/i },
    { word: 'istanza di autotutela', pattern: /autotutela/i },
    { word: 'reclamo', pattern: /\breclamo\b/i },
  ],
  help: {
    debt: 'a debt help service, for example a Caritas help desk, a consumer association (associazione consumatori) or an over-indebtedness help desk (sportello sovraindebitamento)',
    tenant: 'a tenants’ union (sindacato inquilini), for example SUNIA, SICET or UNIAT',
    instalments: 'rateizzazione',
    general: 'a patronato (free help with pensions, benefits and work accidents), a CAF (help with taxes) or a consumer association',
  },
  senders: [
    {
      id: 'entrate',
      slug: 'agenzia-delle-entrate',
      name: 'Tax agency',
      local: 'Agenzia delle Entrate',
      about: 'The national tax office. It handles income tax, your codice fiscale and the registration of rental contracts.',
      patterns: [/agenzia (?:delle )?entrate(?![\s\-–]*riscossione)/i, /agenziaentrate\.gov\.it/i, /\bIRPEF\b/i, /dichiarazione dei redditi/i, /comunicazion[ei] di irregolarità/i, /avviso bonario/i, /controllo (?:automatizzato|formale)/i, /cassetto fiscale/i],
      letters: ['Comunicazione di irregolarità (avviso bonario) — they found a mistake in your tax return and ask you to pay the difference', 'Avviso di accertamento — a formal tax demand after a check', 'Codice fiscale — your tax code, needed for almost everything in Italy'],
      tips: ['If you pay an avviso bonario within the deadline in the letter, the penalty is much lower.', 'A CAF (tax help centre) can check tax letters with you, often for a small fee.'],
    },
    {
      id: 'ader',
      slug: 'agenzia-entrate-riscossione',
      name: 'Tax collection agency',
      local: 'Agenzia delle entrate-Riscossione',
      about: 'Collects unpaid taxes, fines and contributions for other offices. It sends payment demands called cartelle di pagamento.',
      patterns: [/agenzia (?:delle )?entrate[\s\-–]*riscossione/i, /\bADER\b/, /agenziaentrateriscossione/i, /cartell[ae] di pagamento/i, /agente della riscossione/i, /intimazione di pagamento/i, /preavviso di fermo/i, /definizione agevolata/i, /rottamazione/i],
      letters: ['Cartella di pagamento — a demand to pay an unpaid tax, fine or contribution', 'Intimazione di pagamento — a last warning before enforcement', 'Preavviso di fermo amministrativo — they plan to block your car', 'Pignoramento — they take money from your bank account or wages'],
      tips: ['The cartella shows which office the debt comes from (ente creditore). If the debt is wrong, contact that office too.', 'You can ask to pay in instalments (rateizzazione) on their website.'],
    },
    {
      id: 'concessionario',
      slug: 'concessionario-riscossione',
      name: 'Local tax collector',
      local: 'Concessionario della riscossione',
      about: 'A company that collects local taxes and fines for some cities, for example unpaid TARI or parking fines.',
      patterns: [/concessionari[oa] (?:della|per la) riscossione/i, /ingiunzion[ei] fiscal[ei]/i, /ingiunzione di pagamento/i, /accertamento esecutivo/i, /entrate (?:locali|comunali)/i, /\bsoris\b/i, /andreani tributi/i, /\bmunicipia\b/i],
      letters: ['Ingiunzione di pagamento — an order to pay an unpaid local tax or fine', 'Accertamento esecutivo — a tax demand that can be enforced if you don’t pay or appeal in time'],
      tips: ['Check which city and which year the debt is for. Old debts can sometimes be time-barred (prescritti) — a consumer association can check this.'],
    },
    {
      id: 'inps',
      slug: 'inps',
      name: 'Social security institute',
      local: 'INPS',
      about: 'Pays pensions, unemployment benefit (NASpI), child benefit (Assegno unico) and other benefits. It also collects social security contributions.',
      patterns: [/\bINPS\b/i, /istituto nazionale (?:della )?previdenza sociale/i, /\bNASpI\b/i, /assegno unico/i, /indennità di disoccupazione/i, /contributi previdenziali/i],
      letters: ['Accoglimento — your benefit is approved', 'Indebito — they paid you too much and want money back', 'Richiesta di documentazione — they need papers from you', 'Rigetto — your application was refused'],
      tips: ['A patronato can help you with INPS forms and appeals for free.', 'Most INPS online services need a digital login (SPID, CIE or CNS).'],
    },
    {
      id: 'inail',
      slug: 'inail',
      name: 'Work accident insurance',
      local: 'INAIL',
      about: 'Insures workers against accidents at work and work-related illness. It pays you if you are hurt at work.',
      patterns: [/\bINAIL\b/i, /infortuni(?:o)? sul lavoro/i, /malattia professionale/i, /inabilità temporanea/i],
      letters: ['Riconoscimento dell’infortunio — they accept your work accident', 'Convocazione a visita medica — a medical check with their doctor', 'Rigetto — they don’t accept the accident or illness'],
      tips: ['Tell your employer about a work accident right away, and see a doctor the same day.', 'A patronato can help you with INAIL claims for free.'],
    },
    {
      id: 'comune',
      slug: 'comune',
      name: 'Town hall',
      local: 'Comune',
      about: 'Your city or town council. It handles residence (anagrafe), ID cards, the waste tax (TARI) and property tax (IMU).',
      patterns: [/\bcomune di\b/i, /\banagrafe\b/i, /servizi demografici/i, /ufficio tributi/i, /\bTARI\b/, /\bIMU\b/, /stato civile/i, /iscrizione anagrafica/i, /cambio di (?:residenza|abitazione)/i],
      letters: ['Iscrizione anagrafica — your residence registration', 'Avviso di pagamento TARI — your yearly waste tax bill', 'Avviso di accertamento TARI or IMU — a demand for unpaid local tax'],
      tips: ['After you apply for residence, the local police may visit your home to check that you live there. Put your name on the doorbell and the mailbox.', 'Tenants usually pay TARI too, not only owners. Tell the Comune when you move in.'],
    },
    {
      id: 'polizia-locale',
      slug: 'polizia-locale',
      name: 'Local police',
      local: 'Polizia Locale / Municipale',
      about: 'The city police. They send traffic and parking fines (verbali) and check that people live at their registered address.',
      patterns: [/polizia (?:locale|municipale)/i, /comando (?:di )?polizia/i, /verbale di (?:contestazione|accertamento)/i, /codice della strada/i, /\bc\.\s?d\.\s?s\b/i, /\bZTL\b/i, /divieto di sosta/i, /\bautovelox\b/i, /limiti? di velocità/i],
      letters: ['Verbale di contestazione — a fine, for example for parking or speeding', 'Comunicazione dati del conducente — they ask who was driving', 'Accertamento di residenza — a check that you live at your address'],
      tips: ['For most traffic fines you pay 30% less if you pay within 5 days of receiving it.', 'If the fine takes points off a driving licence, you must say who was driving, usually within 60 days.'],
    },
    {
      id: 'questura',
      slug: 'questura',
      name: 'Police immigration office',
      local: 'Questura (Ufficio Immigrazione)',
      about: 'The state police office that issues and renews your residence permit (permesso di soggiorno).',
      patterns: [/questura/i, /ufficio immigrazione/i, /permess[oi] di soggiorno/i, /carta di soggiorno/i, /soggiornanti di lungo periodo/i, /rilievi fotodattiloscopici/i, /fotosegnalamento/i, /poliziadistato\.it/i],
      letters: ['Convocazione — an appointment, for example to give fingerprints or collect your permit', 'Preavviso di rigetto — they plan to refuse your permit and let you explain first', 'Rigetto / Diniego — your permit application was refused'],
      tips: ['Keep the post office receipt (ricevuta) of your permit application with your passport. It shows you applied.', 'Apply to renew your permit early, before it ends. Check the deadline for your type of permit.'],
    },
    {
      id: 'prefettura',
      slug: 'prefettura',
      name: 'Prefecture (immigration desk)',
      local: 'Prefettura – Sportello Unico per l’Immigrazione',
      about: 'The state office in each province. Its immigration desk handles work permits (nulla osta), family reunion and the integration agreement.',
      patterns: [/prefettura/i, /sportello unico (?:per l['’])?immigrazione/i, /ufficio territoriale del governo/i, /nulla osta/i, /ricongiungimento familiare/i, /accordo di integrazione/i, /contratto di soggiorno/i],
      letters: ['Nulla osta — permission to come or stay for work or family', 'Convocazione — an appointment to sign papers, for example the contratto di soggiorno', 'Accordo di integrazione — the integration agreement and its points check'],
      tips: ['Bring original documents and copies to every appointment.', 'You can also appeal some traffic fines to the Prefetto, the head of the Prefettura.'],
    },
    {
      id: 'asl',
      slug: 'asl',
      name: 'Local health authority',
      local: 'ASL (Azienda sanitaria locale)',
      about: 'Runs public health care in your area. You register here with the national health service and choose a family doctor (medico di base).',
      patterns: [/\bA\.?S\.?L\b/, /\bA\.?U\.?S\.?L\b/, /\bASST\b/, /\bULSS\b/, /\bATS\b/, /azienda (?:unità )?sanitaria/i, /azienda socio[\s-]?sanitaria/i, /servizio sanitario (?:nazionale|regionale)/i, /medico di (?:base|medicina generale)/i, /\bticket\b/i],
      letters: ['Iscrizione al Servizio sanitario nazionale — your registration with public health care', 'Sollecito pagamento ticket — an unpaid health fee, for example for a missed appointment', 'Verifica esenzione ticket — they check if you really had the right not to pay a fee'],
      tips: ['If you booked a health appointment and can’t go, cancel it in time. Otherwise you may have to pay the fee anyway.'],
    },
    {
      id: 'tribunale',
      slug: 'tribunale',
      name: 'Court',
      local: 'Tribunale / Giudice di pace',
      about: 'A court. Letters from a court are always important — never ignore them.',
      patterns: [/\btribunale\b/i, /giudice di pace/i, /corte d['’]appello/i, /\bTAR\b/, /\bcancelleria\b/i, /decreto ingiuntivo/i, /atto di citazione/i, /\budienza\b/i, /\bsentenza\b/i],
      letters: ['Decreto ingiuntivo — a court order to pay. You usually have 40 days to oppose it', 'Atto di citazione — someone is taking you to court', 'Convalida di sfratto — the court hearing for an eviction', 'Sentenza — a judgment'],
      tips: ['Court deadlines are strict and short. Get advice from a lawyer quickly.', 'If your income is low, you may get a free lawyer (patrocinio a spese dello Stato).'],
    },
    {
      id: 'ufficiale-giudiziario',
      slug: 'ufficiale-giudiziario',
      name: 'Court bailiff',
      local: 'Ufficiale giudiziario (UNEP)',
      about: 'A court officer who delivers court papers and carries out seizures and evictions.',
      patterns: [/ufficial[ei] giudiziari[oa]?/i, /\bUNEP\b/, /ufficio (?:unico )?(?:notificazioni|notifiche)/i, /atto di precetto/i, /pignoramento presso terzi/i, /pignoramento mobiliare/i, /avviso di sloggio/i],
      letters: ['Atto di precetto — a formal demand to pay within a short time (at least 10 days) before they can seize things', 'Pignoramento — seizure of money, wages or things', 'Avviso di sloggio — the date when an eviction will be carried out'],
      tips: ['Don’t ignore a precetto or a pignoramento. Get advice from a lawyer or a debt help service the same week.', 'Part of your wages and pension is protected by law and can’t be taken.'],
    },
    {
      id: 'locatore',
      slug: 'locatore',
      name: 'Landlord or letting agency',
      local: 'Locatore / Agenzia immobiliare',
      about: 'The owner of your flat, or the agency or building manager (amministratore di condominio) that works for them.',
      patterns: [/\blocatore\b/i, /\bconduttore\b/i, /contratto di locazione/i, /canone di locazione/i, /agenzia immobiliare/i, /amministratore (?:di )?condominio/i, /\bcondominio\b/i, /\baffitto\b/i, /deposito cauzionale/i, /oneri condominiali/i],
      letters: ['Disdetta — notice that your rental contract will end', 'Sollecito / Messa in mora — you owe rent and they ask you to pay', 'Rendiconto spese condominiali — the bill for shared building costs'],
      tips: ['Your rental contract must be registered with the Agenzia delle Entrate. Ask your landlord for proof of registration.', 'The deposit (deposito cauzionale) can be at most 3 months’ rent. You should get it back at the end, minus the cost of any damage.'],
    },
    {
      id: 'fornitore',
      slug: 'fornitore-luce-gas-acqua',
      name: 'Energy or water supplier',
      local: 'Fornitore di luce, gas o acqua',
      about: 'The company that sells you electricity, gas or water, for example Enel, A2A, Hera, Iren or Acea.',
      patterns: [/\benel\b/i, /\bA2A\b/, /\bhera\b/i, /\biren\b/i, /\bacea\b/i, /\bedison\b/i, /plenitude/i, /sorgenia/i, /\bPOD\b/, /\bPDR\b/, /\bbollett[ae]\b/i, /fornitura di (?:energia|gas|acqua)/i, /energia elettrica/i, /servizio idrico/i, /\bkWh\b/i, /\bSmc\b/, /\bARERA\b/i],
      letters: ['Bolletta — your regular bill', 'Conguaglio — an adjustment after a real meter reading: you may pay extra or get money back', 'Costituzione in mora — a formal warning before they cut or reduce your supply'],
      tips: ['If you think a bill is wrong, send a written complaint (reclamo) to the supplier. If they don’t solve it, you can use the free ARERA conciliation service.', 'Charges for usage more than 2 years old can often be refused (prescrizione). A consumer association can check this.'],
    },
    {
      id: 'recupero-crediti',
      slug: 'recupero-crediti',
      name: 'Debt collection agency',
      local: 'Società di recupero crediti',
      about: 'A company that collects money for someone else, for example a phone or energy company. Check that the debt is real before you pay.',
      patterns: [/recupero crediti/i, /società di recupero/i, /gestione (?:del )?credit/i, /cessione del credito/i, /cessionari[oa] del credito/i],
      letters: ['Sollecito di pagamento — they ask you to pay a debt plus costs', 'Diffida / Messa in mora — a formal warning before they go to court', 'Comunicazione di cessione del credito — your debt was sold to them'],
      tips: ['Ask for proof of the original debt (contract and bills) if you don’t recognise it.', 'Old debts can be time-barred (prescritti). A consumer association (associazione consumatori) can check this.'],
    },
    {
      id: 'poste',
      slug: 'poste-italiane',
      name: 'Post office',
      local: 'Poste Italiane',
      about: 'The national post. If you miss a registered letter, they leave a notice (avviso di giacenza) so you can collect it.',
      patterns: [/poste ?italiane/i, /avviso di giacenza/i, /compiuta giacenza/i, /in giacenza/i],
      letters: ['Avviso di giacenza — a registered letter is waiting for you at the post office', 'Atto giudiziario — an official legal letter, for example from a court, a tax office or a fines office'],
      tips: ['Collect registered letters quickly. A deadline can start even if you never pick the letter up.'],
    },
  ],
  kinds: [
    {
      id: 'cartella', type: 'fee-decision', local: 'Cartella di pagamento', name: 'Payment demand from the tax collector', about: 'A demand to pay an unpaid tax, fine or contribution. You usually have 60 days from when you receive it to pay. After that, interest is added and they can start enforcement.', urgency: 'high', patterns: [/cartell[ae] di pagamento/i, /\bcartella\b(?! clinica)/i, /iscritt[ae] a ruolo/i],
      steps: ['Check which office the debt comes from (ente creditore) and which year it is for.', 'How you appeal depends on the kind of debt (tax, fine or contributions). The cartella says where and by when. Get advice quickly if you think it is wrong.'],
    },
    {
      id: 'intimazione', type: 'reminder', local: 'Intimazione di pagamento', name: 'Final demand before enforcement', about: 'A last demand for a debt from an older cartella. You usually have only 5 days to pay. After that, they can take money or goods by force.', urgency: 'high', patterns: [/intimazione di pagamento/i, /intimazione ad adempiere/i, /avviso di intimazione/i, /\bintima\b/i],
      steps: ['Act now. Pay, or ask for instalments (rateizzazione) right away. If you think the debt is too old or wrong, get advice the same day.'],
    },
    {
      id: 'esecuzione', type: 'enforcement', local: 'Fermo / Pignoramento', name: 'Enforcement notice', about: 'They are taking steps to collect a debt by force, for example by blocking your car (fermo amministrativo) or taking money from your bank account or wages (pignoramento).', urgency: 'high', patterns: [/fermo amministrativo/i, /preavviso di fermo/i, /\bpignor(?:ament|are|at)/i, /iscrizione (?:di )?ipoteca/i, /preavviso di (?:iscrizione )?ipoteca/i, /atto di precetto/i, /\bprecetto\b/i, /esecuzione forzata/i, /procedura esecutiva/i],
      steps: ['A preavviso di fermo usually gives you 30 days. After that, your car is blocked and you must not drive it.', 'An atto di precetto gives you at least 10 days to pay. After that, they can start seizing money or goods.'],
    },
    {
      id: 'avviso-bonario', type: 'tax-assessment', local: 'Avviso bonario / Comunicazione di irregolarità', name: 'Tax notice after a check', about: 'The tax office checked your tax return and thinks you owe more. If you pay within the deadline in the letter, the penalty is reduced.', urgency: 'medium', patterns: [/avviso bonario/i, /comunicazion[ei] di irregolarità/i, /controllo automatizzato/i, /controllo formale/i, /36-bis/i, /36-ter/i, /54-bis/i],
      steps: ['If the amount is right, pay it by the deadline in the letter to get the lower penalty. You usually pay with the F24 form that comes with it.', 'If it is wrong, tell the tax office before the deadline — online with the CIVIS service, at an office, or with help from a CAF.'],
    },
    {
      id: 'accertamento', type: 'tax-assessment', local: 'Avviso di accertamento', name: 'Tax assessment', about: 'A formal tax demand after a check. If you don’t pay or appeal in time — usually 60 days — it goes to the tax collector.', urgency: 'high', patterns: [/avvis[oi] di accertamento/i, /accertamento (?:esecutivo|con adesione)/i, /maggiore imposta/i, /rettifica (?:della dichiarazione|del reddito)/i],
      steps: ['You can appeal (ricorso) to the tax court (Corte di giustizia tributaria), usually within 60 days of receiving it. For amounts over €3,000 you need a tax adviser or a lawyer.', 'You can also ask the office to discuss it and agree on an amount (accertamento con adesione). Get advice before you do.'],
    },
    {
      id: 'verbale', type: 'fine', local: 'Verbale / Multa', name: 'Fine', about: 'An official fine, for example for parking or speeding. The letter shows the amount, how to pay and how to appeal.', urgency: 'high', patterns: [/verbale di (?:contestazione|accertamento)/i, /\bmult[ae]\b/i, /codice della strada/i, /violazione dell['’]art/i, /pagamento in misura ridotta/i, /decurtazione (?:di |dei )?punti/i],
      steps: ['For most traffic fines: pay within 5 days of receiving it to pay 30% less. Otherwise pay the normal amount within 60 days. After that, the fine gets much higher.', 'If you think it’s wrong, you can usually appeal to the Prefetto within 60 days or to the Giudice di pace within 30 days. Check the letter for the exact rules.'],
    },
    {
      id: 'convocazione', type: 'appointment', local: 'Convocazione', name: 'Appointment', about: 'They ask you to come to an appointment. Missing it without a good reason can delay or harm your application.', urgency: 'medium', patterns: [/convocazione/i, /\bconvocat[oaie]\b/i, /invit(?:iamo|a) a presentarsi/i, /presentarsi presso/i, /\bsi presenti\b/i, /\bappuntamento\b/i],
      steps: ['Bring your passport or ID, your codice fiscale, this letter and every document the letter lists — originals and copies.'],
    },
    { id: 'documenti', type: 'documents', local: 'Richiesta di documentazione / Integrazione', name: 'Request for documents', about: 'They need more papers or information from you before they can decide.', urgency: 'medium', patterns: [/richiesta di (?:documentazione|documenti|integrazione)/i, /integrazione (?:documentale|della documentazione|della pratica|dell['’]istanza)/i, /documentazione (?:integrativa|mancante)/i, /si invita a (?:produrre|trasmettere|integrare|inviare)/i, /(?:produrre|trasmettere|inviare) (?:la seguente documentazione|i seguenti documenti)/i] },
    {
      id: 'preavviso-rigetto', type: 'hearing', local: 'Preavviso di rigetto', name: 'Notice before refusal', about: 'They plan to refuse your application and tell you why. You can send written comments (osservazioni) and documents first — usually within 10 days.', urgency: 'high', patterns: [/preavviso di (?:rigetto|diniego)/i, /motivi ostativi/i, /\b10[- ]?bis\b/i, /osservazioni (?:scritte|per iscritto)/i, /(?:presentare|produrre) (?:le proprie |eventuali )?osservazioni/i],
      steps: ['Send your written comments and any missing documents within the deadline in the letter — usually 10 days. This can change the decision.'],
    },
    {
      id: 'rigetto', type: 'rejection', local: 'Rigetto / Diniego', name: 'Refusal', about: 'Your application was refused. You can usually appeal if you think this is wrong — the letter says where and by when.', urgency: 'high', patterns: [/(?<!preavviso di )\brigetto\b/i, /(?<!preavviso di )\bdiniego\b/i, /\brigettat[ao]\b/i, /\brespint[ao]\b/i, /non (?:può essere|viene|è stat[ao]) accolt[ao]/i, /non accoglimento/i, /\bsi rigetta\b/i],
      steps: ['If the refusal is about your residence permit, get advice quickly from a lawyer or a patronato. Deadlines are short.'],
    },
    { id: 'accoglimento', type: 'approval', local: 'Accoglimento', name: 'Approval', about: 'Your application was approved. The letter shows what you get and from when.', urgency: 'low', patterns: [/(?<!non )\baccoglimento\b/i, /(?<!non )(?:è stat[ao] |viene )accolt[ao]/i, /\bsi accoglie\b/i, /esito positivo/i] },
    {
      id: 'indebito', type: 'repayment', local: 'Indebito / Recupero', name: 'Request to pay money back', about: 'They believe they paid you too much, for example a benefit, and want the money back.', urgency: 'high', patterns: [/\bindebit[oi]\b/i, /indebitamente percepit/i, /somm[ae] non dovut[ae]/i, /da restituire/i, /ripetizione dell['’]indebito/i, /recupero (?:della somma|delle somme|dell['’]importo|dell['’]indebito|della prestazione)/i, /restituzione (?:della somma|delle somme|dell['’]importo)/i],
      steps: ['Check the amount and the period. If you think it’s wrong, a patronato can help you appeal for free.', 'You can usually ask to pay it back in instalments (rateizzazione).'],
    },
    { id: 'sollecito', type: 'reminder', local: 'Sollecito / Messa in mora / Diffida', name: 'Payment reminder or formal warning', about: 'You have not paid something on time, or they formally warn you to do something. If you wait, they can add costs or go to court.', urgency: 'high', patterns: [/\bsollecit[oi]\b/i, /messa in mora/i, /costituzione in mora/i, /\bdiffida\b/i, /\bdiffidiamo\b/i, /mancato pagamento/i, /\binsolut[oi]\b/i, /\bmorosità(?![A-Za-zÀ-ɏ])/i, /non risulta(?:no)? (?:ancora )?pagat/i] },
    {
      id: 'disdetta', type: 'termination', local: 'Disdetta / Sfratto', name: 'Notice to end a contract or eviction', about: 'A contract is being ended, for example your rental contract or a supply contract. An eviction (sfratto) always goes through a court.', urgency: 'high', patterns: [/\bdisdett[ae]\b/i, /\bsfratto\b/i, /recesso dal contratto/i, /risoluzione del contratto/i, /convalida (?:di|dello) sfratto/i, /rilascio dell['’]immobile/i, /finita locazione/i],
      steps: ['If you get an eviction notice (sfratto), go to the court hearing (udienza) on the date in the letter, ideally with a lawyer or a tenants’ union. Don’t ignore it.'],
    },
    { id: 'bolletta', type: 'utility-bill', local: 'Bolletta / Fattura', name: 'Bill', about: 'A bill, for example for electricity, gas, water or your phone. It shows how much to pay and by when. A conguaglio is an adjustment after a real meter reading: you may pay extra or get money back.', urgency: 'medium', weight: 0.6, patterns: [/\bbollett[ae]\b/i, /\bconguagli[oi]\b/i, /\bfattur[ae]\b/i, /lettura (?:del contatore|reale|stimata)/i, /consumi (?:stimati|effettivi|fatturati)/i] },
    { id: 'provvedimento', type: 'decision', local: 'Provvedimento', name: 'Official decision', about: 'A formal decision by an office. It usually says at the end how and by when you can challenge it.', urgency: 'medium', weight: 0.4, patterns: [/\bprovvediment[oi]\b/i, /\bdecreto\b/i, /\bsi dispone\b/i, /determin(?:a|azione) dirigenziale/i] },
  ],
  references: [
    { name: 'Payment demand number', local: 'Numero cartella', pattern: /(?:numero (?:della )?cartella|\bcartella\s?(?:n\.|nr\.?|n[°º])|\bn\. cartella)/gi },
    { name: 'Fine number', local: 'Numero verbale', pattern: /(?:numero (?:del )?verbale|\bverbale\s?(?:n\.|nr\.?|n[°º])|\bn\. verbale)/gi },
    { name: 'Case number', local: 'Numero pratica', pattern: /(?:numero (?:di |della )?pratica|codice pratica|\bpratica\s?(?:n\.|nr\.?|n[°º]))/gi },
    { name: 'Reference number', local: 'Protocollo', pattern: /(?:numero di protocollo|\bprot(?:ocollo)?\.?\s?(?:n\.|nr\.?|n[°º])|\bprotocollo\b)/gi },
    { name: 'Your reference', local: 'Numero di riferimento', pattern: /(?:numero di riferimento|\brif\.(?:\s?n\.)?)/gi },
    { name: 'Tax code', local: 'Codice fiscale', personal: true, pattern: /(?:codice fiscale|\bcod\.\s?fisc\.?|\bC\.F\.)/gi },
    { name: 'Payment code', local: 'Codice avviso PagoPA', payment: true, pattern: /(?:codice avviso(?: pagopa)?|codice iuv|\bIUV\b)/gi },
    { name: 'Payment reference', local: 'Causale', payment: true, pattern: /causale(?: del versamento| di pagamento)?/gi },
    { name: 'Customer number', local: 'Codice cliente', pattern: /(?:codice cliente|cod\. cliente|numero cliente)/gi },
    { name: 'Bill number', local: 'Numero fattura', pattern: /(?:numero (?:della )?(?:fattura|bolletta)|\b(?:fattura|bolletta)\s?(?:n\.|nr\.?|n[°º])|\bn\. fattura)/gi },
    { name: 'Meter point code', local: 'POD / PDR', pattern: /(?:codice (?:POD|PDR)|\bPOD\b|\bPDR\b)/gi },
    { name: 'INPS number', local: 'Matricola INPS', pattern: /(?:numero di matricola|matricola(?: inps| aziendale)?)/gi },
  ],
  glossary: [
    { term: 'Codice fiscale', slug: 'codice-fiscale', pattern: /codice fiscale|\bC\.F\./i, meaning: 'Your personal tax code: 16 letters and numbers. You need it for almost everything — work, rent, the doctor, a bank account.', tip: 'Write it on every letter you send to an office.' },
    { term: 'Partita IVA', slug: 'partita-iva', pattern: /partita iva|\bP\.\s?IVA\b/i, meaning: 'VAT number for self-employed people and companies. You need one if you work as a freelancer.' },
    { term: 'Permesso di soggiorno', slug: 'permesso-di-soggiorno', pattern: /permess[oi] di soggiorno/i, meaning: 'Residence permit for people who are not EU citizens.', tip: 'Apply to renew it before it ends, and keep the post office receipt (ricevuta) with your passport.' },
    { term: 'Residenza', slug: 'residenza', pattern: /\bresidenza\b/i, meaning: 'Your official registered address in Italy, recorded by the Comune.' },
    { term: 'Anagrafe', slug: 'anagrafe', pattern: /anagraf/i, meaning: 'The Comune’s register of residents. You register your address here.' },
    { term: 'Carta d’identità', slug: 'carta-d-identita', pattern: /carta d['’]identità/i, meaning: 'ID card from the Comune. Foreign residents can get one too, but for them it is not a travel document.' },
    { term: 'Tessera sanitaria', slug: 'tessera-sanitaria', pattern: /tessera sanitaria/i, meaning: 'Health card. It also shows your codice fiscale.' },
    { term: 'SPID', slug: 'spid', pattern: /\bSPID\b/i, meaning: 'Digital identity. You use it to log in to public websites, like INPS or the Agenzia delle Entrate.' },
    { term: 'Cartella di pagamento', slug: 'cartella-di-pagamento', pattern: /cartell[ae] di pagamento/i, meaning: 'A demand from the tax collector to pay an unpaid tax, fine or contribution.', tip: 'You usually have 60 days to pay. The cartella also says how and by when you can appeal.' },
    { term: 'Avviso di accertamento', slug: 'avviso-di-accertamento', pattern: /avvis[oi] di accertamento/i, meaning: 'A formal tax demand after a check by the tax office. You can usually appeal within 60 days.' },
    { term: 'Avviso bonario', slug: 'avviso-bonario', pattern: /avviso bonario|comunicazion[ei] di irregolarità/i, meaning: 'A tax notice after a check of your tax return. If you pay in time, the penalty is lower.' },
    { term: 'Ente creditore', slug: 'ente-creditore', pattern: /ente creditore/i, meaning: 'The office that is owed the money, for example a city or the tax office.' },
    { term: 'Sanzione', slug: 'sanzione', pattern: /sanzion/i, meaning: 'Penalty or fine.' },
    { term: 'Interessi', slug: 'interessi', pattern: /\binteressi\b/i, meaning: 'Interest. Extra money added, usually because a payment is late.' },
    { term: 'Rateizzazione', slug: 'rateizzazione', pattern: /rateizza|rateazione|\bin rate\b/i, meaning: 'Paying a debt in instalments.', tip: 'Ask before the deadline. For debts with the tax collector you can ask online.' },
    { term: 'F24', slug: 'f24', pattern: /\bF24\b/i, meaning: 'The standard form to pay taxes. You can pay it online, at a bank or at a post office.' },
    { term: 'PagoPA', slug: 'pagopa', pattern: /pago\s?pa/i, meaning: 'The national system for paying public offices. Each payment has its own codice avviso.', tip: 'You can pay a PagoPA notice online, in your banking app, at a bank, at a post office or in many tobacco shops.' },
    { term: 'Codice avviso', slug: 'codice-avviso', pattern: /codice avviso/i, meaning: 'The 18-digit code you need to pay a PagoPA notice.' },
    { term: 'Bollettino', slug: 'bollettino', pattern: /bollettin/i, meaning: 'A payment slip. You can pay it at the post office, at a bank or online.' },
    { term: 'Notifica', slug: 'notifica', pattern: /\bnotific/i, meaning: 'Formal delivery of an official letter. Many deadlines start on this day.', tip: 'Write down the day you received the letter and keep the envelope.' },
    { term: 'Raccomandata', slug: 'raccomandata', pattern: /raccomandat/i, meaning: 'Registered letter. You sign when you receive it. With “A/R”, the sender gets proof of delivery.' },
    { term: 'Avviso di giacenza', slug: 'avviso-di-giacenza', pattern: /giacenza/i, meaning: 'Notice that a registered letter is waiting for you at the post office.', tip: 'Collect it soon. A deadline can start even if you don’t collect it.' },
    { term: 'PEC', slug: 'pec', pattern: /\bPEC\b|posta elettronica certificata/i, meaning: 'Certified email. A message sent by PEC counts like a registered letter.', tip: 'A message to your PEC address counts as delivered even if you don’t read it. Check it often.' },
    { term: 'Ricorso', slug: 'ricorso', pattern: /\bricorso\b/i, meaning: 'Appeal. A formal request to a court or a higher office to change a decision.', tip: 'Check the deadline and where to send it. Both are written in the letter, usually near the end.' },
    { term: 'Opposizione', slug: 'opposizione', pattern: /\bopposizione\b/i, meaning: 'A formal challenge, for example against a court payment order.' },
    { term: 'Autotutela', slug: 'autotutela', pattern: /autotutela/i, meaning: 'A request to the office to cancel or correct its own act, for example when it is clearly wrong. It does not stop the deadline to appeal.' },
    { term: 'Reclamo', slug: 'reclamo', pattern: /\breclamo\b/i, meaning: 'Complaint, for example to a supplier about a wrong bill.' },
    { term: 'Termine', slug: 'termine', pattern: /\btermine\b/i, meaning: 'Deadline or time limit.' },
    { term: 'Scadenza', slug: 'scadenza', pattern: /\bscadenz/i, meaning: 'Due date, or the date something ends.' },
    { term: 'Pignoramento', slug: 'pignoramento', pattern: /pignorament/i, meaning: 'Seizure of money, wages or things to pay a debt.', tip: 'Part of your wages and pension is protected by law. Get advice quickly.' },
    { term: 'Fermo amministrativo', slug: 'fermo-amministrativo', pattern: /fermo amministrativo/i, meaning: 'A block on your car or motorbike because of an unpaid debt. You must not drive it while it is blocked.', tip: 'Contact the tax collector right away and ask about paying in instalments. This can stop or pause the block.' },
    { term: 'Ipoteca', slug: 'ipoteca', pattern: /ipotec/i, meaning: 'A legal charge on a house or flat, for example because of a large unpaid debt.' },
    { term: 'Precetto', slug: 'precetto', pattern: /\bprecetto\b/i, meaning: 'A formal demand to pay within a short time. After it, the creditor can start seizing money or things.' },
    { term: 'Decreto ingiuntivo', slug: 'decreto-ingiuntivo', pattern: /decreto ingiuntivo/i, meaning: 'A court order to pay a debt.', tip: 'You usually have 40 days to oppose it. Get a lawyer quickly.' },
    { term: 'Udienza', slug: 'udienza', pattern: /\budienza\b/i, meaning: 'Court hearing.' },
    { term: 'Verbale', slug: 'verbale', pattern: /\bverbal[ei]\b/i, meaning: 'Official report. For fines, the verbale is the fine itself.' },
    { term: 'Decurtazione punti', slug: 'decurtazione-punti', pattern: /decurtazione (?:di |dei )?punti|punti (?:della|dalla) patente/i, meaning: 'Points taken off a driving licence.' },
    { term: 'TARI', slug: 'tari', pattern: /\bTARI\b|tassa (?:sui|dei) rifiuti/i, meaning: 'Waste collection tax. The person who lives in the home pays it — usually tenants too.' },
    { term: 'IMU', slug: 'imu', pattern: /\bIMU\b/i, meaning: 'Property tax. Owners pay it, but usually not on the home they live in.' },
    { term: 'ISEE', slug: 'isee', pattern: /\bISEE\b/i, meaning: 'A statement of your family’s income and savings. Many benefits and discounts depend on it.', tip: 'A CAF can prepare your ISEE for free.' },
    { term: 'NASpI', slug: 'naspi', pattern: /\bNASpI\b/i, meaning: 'Unemployment benefit, paid by INPS after you lose your job.', tip: 'Apply within 68 days after your job ends.' },
    { term: 'INPS', slug: 'inps', pattern: /\bINPS\b/i, meaning: 'The national social security institute. It pays pensions and many benefits.' },
    { term: 'Diffida', slug: 'diffida', pattern: /\bdiffid/i, meaning: 'Formal warning. They tell you to do something, often to pay, or they will take legal steps.' },
    { term: 'Messa in mora', slug: 'messa-in-mora', pattern: /messa in mora|costituzione in mora/i, meaning: 'Formal demand to pay. After it, interest can be added and legal steps can follow.' },
    { term: 'Sfratto', slug: 'sfratto', pattern: /\bsfratt/i, meaning: 'Eviction. Only a court can order it.', tip: 'Go to the court hearing on the date in the letter. A tenants’ union (SUNIA, SICET) can help.' },
    { term: 'Deposito cauzionale', slug: 'deposito-cauzionale', pattern: /deposito cauzionale|\bcauzione\b/i, meaning: 'Rental deposit. It can be at most 3 months’ rent.' },
    { term: 'CAF', slug: 'caf', pattern: /\bCAF\b/, meaning: 'Tax help centre. It helps with tax returns, ISEE and tax letters, often for free or a small fee.' },
    { term: 'Patronato', slug: 'patronato', pattern: /patronat/i, meaning: 'Free help centre for pensions, benefits and work accidents. Many also help with residence permit forms.' },
    { term: 'Preavviso di rigetto', slug: 'preavviso-di-rigetto', pattern: /preavviso di (?:rigetto|diniego)|motivi ostativi/i, meaning: 'Notice that they plan to refuse your application. You can reply with comments, usually within 10 days.' },
    { term: 'Conguaglio', slug: 'conguaglio', pattern: /conguagli/i, meaning: 'Adjustment. The difference between estimated and real use: you pay extra or get money back.' },
  ],
  extraReplies: [
    {
      id: 'autotutela',
      title: 'Ask them to cancel a clear mistake (istanza di autotutela)',
      advice: 'Use this if the notice is clearly wrong, for example you already paid or it is for someone else. It does not stop the deadline to appeal, so watch that date too.',
      english: 'Please cancel or correct your notice, because it is wrong: [reason, for example: I already paid on [date]]. I attach a copy of the notice and my proof. Please confirm that you received this letter and answer in writing.',
      subject: 'Oggetto: Istanza di annullamento in autotutela',
      body: (result) => [
        `con la presente il/la sottoscritto/a chiede l’annullamento o la correzione in autotutela del Vostro atto ${result.letterDate ? `del ${d(result.letterDate)}` : 'del [GG/MM/AAAA]'}.`,
        '',
        'L’atto è errato per il seguente motivo: [ad esempio: ho già pagato l’importo il [data] / l’atto riguarda un’altra persona / c’è un errore di calcolo].',
        '',
        'Allego copia dell’atto e i documenti che lo dimostrano [ad esempio: la ricevuta di pagamento].',
        '',
        'Chiedo la conferma di ricezione della presente e una risposta scritta.',
      ],
      when: (result) => ['entrate', 'ader', 'comune', 'concessionario'].includes(result.sender?.id) || ['tax-assessment', 'fee-decision'].includes(result.kind?.type),
    },
  ],
  samples: [
    {
      id: 'cartella',
      title: 'Tax collection agency',
      subtitle: 'Payment demand (cartella) with a deadline',
      build(today) {
        const letter = addDays(today, -5);
        const year = Number(today.slice(0, 4)) - 2;
        const due = nextWorkday(addDays(letter, 60));
        return `Agenzia delle entrate-Riscossione
Ambito provinciale di Milano
Via dell’Esempio 10 · 20121 Milano MI
www.agenziaentrateriscossione.gov.it

Sig.ra
Sarah Esempio
Via delle Prove 24
20154 Milano MI

Milano, ${d(letter)}
Codice fiscale: SMPSRH90C54Z404N
Numero cartella: 068 2026 0012345678 000

CARTELLA DI PAGAMENTO

Gentile Sig.ra Esempio,

l’ente creditore indicato sotto ha affidato all’Agenzia delle entrate-Riscossione la riscossione delle seguenti somme, che risultano a Suo carico.

Ente creditore: Agenzia delle Entrate – Direzione Provinciale I di Milano
Tributo: IRPEF, anno d’imposta ${year}
Imposta: € 1.050,00
Sanzioni: € 105,00
Interessi: € 61,76
Diritti di notifica: € 5,88
Oneri di riscossione: € 11,92
Importo totale da pagare: € 1.234,56

Deve pagare l’importo totale entro il ${d(due)}. Dopo questa data sono dovuti gli interessi di mora e l’agente della riscossione può avviare le procedure di recupero previste dalla legge.

Come pagare
Può pagare con PagoPA online, con l’home banking, in banca, presso gli uffici postali o nelle tabaccherie abilitate.
Codice avviso: 3010 0000 0012 3456 78

Se paga dall’estero, può fare un bonifico bancario:
Beneficiario: Agenzia delle entrate-Riscossione
IBAN: IT60 X054 2811 1010 0000 0123 456
Causale: codice avviso 3010 0000 0012 3456 78

Se non può pagare l’intero importo in una sola volta, può chiedere la rateizzazione sul sito www.agenziaentrateriscossione.gov.it o presso i nostri sportelli.

Come contestare
Contro la presente cartella può presentare ricorso alla Corte di giustizia tributaria di primo grado di Milano entro 60 giorni dalla notifica. Se ritiene che le somme non siano dovute, può anche rivolgersi all’ente creditore e chiedere l’annullamento in autotutela.

Distinti saluti
Agenzia delle entrate-Riscossione`;
      },
    },
    {
      id: 'questura',
      title: 'Police immigration office',
      subtitle: 'Residence permit appointment',
      build(today) {
        const letter = addDays(today, -4);
        const applied = addDays(today, -40);
        const appointment = nextWorkday(addDays(today, 8));
        return `QUESTURA DI BOLOGNA
Ufficio Immigrazione
Via dei Servizi 12 · 40121 Bologna BO
PEC: immigrazione.bologna@pec.esempio.it

Bologna, ${d(letter)}
Prot. n. 2026/IMM/004567
Numero pratica: 26BO-0012345

Sig.
Daniel Esempio
Via delle Prove 7
40125 Bologna BO
Codice fiscale: SMPDNL88E21Z404M

Oggetto: Convocazione per i rilievi fotodattiloscopici – rinnovo del permesso di soggiorno

Gentile Sig. Esempio,

in relazione alla Sua richiesta di rinnovo del permesso di soggiorno per lavoro subordinato, presentata presso l’ufficio postale in data ${d(applied)}, La invitiamo a presentarsi presso l’Ufficio Immigrazione della Questura di Bologna, sportello 4,

il ${d(appointment)} alle ore 9:30

per i rilievi fotodattiloscopici (impronte digitali).

Dovrà portare con sé:
- la presente convocazione
- il passaporto in corso di validità e una fotocopia
- la ricevuta rilasciata dall’ufficio postale
- 4 fotografie formato tessera, recenti e uguali
- il permesso di soggiorno da rinnovare

Se non può presentarsi nel giorno indicato, comunichi il motivo prima dell’appuntamento all’indirizzo PEC indicato sopra. La mancata presentazione senza giustificato motivo può ritardare la definizione della Sua pratica.

Distinti saluti
Il Dirigente dell’Ufficio Immigrazione`;
      },
    },
  ],
};
