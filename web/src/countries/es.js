import { addDays, addMonths, formatLocalDate, fromIso } from '../dates.js';

const fmt = (iso) => formatLocalDate(iso, '/');

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

function voluntaryPaymentEnd(notified) {
  const [year, month, day] = notified.split('-').map(Number);
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = day <= 15 ? addDays(addMonths(first, 1), 19) : addDays(addMonths(first, 2), 4);
  return nextWorkday(end);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function letterOf(result) {
  return result.letterDate ? `de fecha ${fmt(result.letterDate)}` : 'de fecha [DD/MM/AAAA]';
}

function alegacionesBody(of) {
  return [
    `Por medio del presente escrito formulo alegaciones en relación con su escrito ${of}.`,
    '',
    'Alegaciones: [Explique en pocas frases por qué no está de acuerdo.]',
    '',
    'Adjunto: [Lista de los documentos que lo demuestran.]',
    '',
    'Solicito que se tengan en cuenta estas alegaciones antes de resolver y que se me confirme la recepción de este escrito.',
  ];
}

export default {
  id: 'es',
  slug: 'spain',
  name: 'Spain',
  adjective: 'Spanish',
  flag: '🇪🇸',
  language: 'es',
  currency: 'EUR',
  decimal: ',',
  thousands: '.',
  dateSeparator: '/',
  ibanLength: 24,
  intro: 'Spanish offices send formal letters with strict deadlines, often counted in working days (días hábiles). Many letters now arrive online as electronic notifications: they count as delivered when you open them, or after 10 calendar days if you don’t.',
  signals: [/\bEspaña\b/i, /\.gob\.es\b/i, /\bES\d{2}\s?\d{4}/, /\b(?:NIE|NIF|DNI)\b/, /agencia (?:estatal de administración )?tributaria/i, /seguridad social/i, /\bayuntamiento\b/i, /\bDGT\b/, /\b\d{5}\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/, /\bC\/\s?[A-ZÁÉÍÓÚÑ]/],
  deliveryDays: 3,
  deliveryNote: 'In Spain, deadlines usually count from the day after the letter is delivered (notificación). A paper letter is delivered on the day you receive it; an electronic one when you open it, or 10 calendar days after it was made available. We estimate 3 days for post — use the real date if you know it.',
  objection: [
    { word: 'recurso de reposición', pattern: /recurso (?:potestativo )?de reposici[óo]n/i },
    { word: 'reclamación económico-administrativa', pattern: /reclamaci[óo]n econ[óo]mico[- ]administrativa/i },
    { word: 'recurso de alzada', pattern: /recurso de alzada/i },
    { word: 'reclamación previa', pattern: /reclamaci[óo]n (?:administrativa )?previa/i },
    { word: 'alegaciones', pattern: /(?:podrá|puede|pueden|podrán)\s+(?:usted\s+)?(?:formular|presentar|realizar|efectuar|hacer)\s+(?:las\s+)?alegaciones|(?:podrá|puede)\s+alegar/i },
    { word: 'oposición', pattern: /escrito de oposici[óo]n|formul(?:ar|e) oposici[óo]n/i },
    { word: 'recurso', pattern: /\brecurso\b/i },
  ],
  objectionAdvice: 'Use this if you think the decision is wrong. Give your reasons and add proof — an appeal needs them. Send it before the deadline, online in the office’s sede electrónica or at any public registry office, and keep the receipt.',
  help: {
    debt: 'the social services of your town hall (servicios sociales), its consumer office (OMIC) or Cáritas',
    tenant: 'a tenants’ union (sindicato de inquilinos), a consumer association (OCU, FACUA)',
    instalments: 'aplazamiento o fraccionamiento',
    general: 'the social services of your town hall (servicios sociales del ayuntamiento), a consumer association, or a migrant support service such as Cruz Roja or Cáritas',
  },
  senders: [
    {
      id: 'aeat',
      slug: 'agencia-tributaria',
      name: 'Tax agency',
      local: 'Agencia Tributaria (AEAT)',
      about: 'The state tax office, often called Hacienda. It handles income tax (IRPF), VAT (IVA) and tax refunds.',
      patterns: [/agencia (?:estatal de administración )?tributaria(?!\s+(?:de\s|del\s|canaria|valenciana|madrid))/i, /\bAEAT\b/, /agenciatributaria/i, /\bIRPF\b/, /impuesto sobre la renta de (?:las personas físicas|no residentes)/i, /\bmodelo (?:100|130|210|303|720)\b/i],
      letters: ['Liquidación provisional — they changed your tax result, and you may owe more', 'Propuesta de liquidación — a draft tax bill; you can reply first (alegaciones)', 'Requerimiento — they ask for documents or information', 'Providencia de apremio — you paid late, so a surcharge is added'],
      tips: ['You can read your tax letters online in the sede electrónica of the Agencia Tributaria, with Cl@ve or a digital certificate.', 'You can usually appeal a tax decision within one month (recurso de reposición).'],
    },
    {
      id: 'tgss',
      slug: 'tesoreria-seguridad-social',
      name: 'Social Security treasury',
      local: 'Tesorería General de la Seguridad Social (TGSS)',
      about: 'Registers workers and collects Social Security payments (cotizaciones), for example the monthly fee of self-employed people (autónomos).',
      patterns: [/tesorería general de la seguridad social/i, /\bTGSS\b/, /\bRETA\b/, /cotizaci[óo]n/i, /import@ss/i, /régimen especial de (?:los )?trabajadores (?:por cuenta propia o )?autónomos/i, /número de afiliación/i],
      letters: ['Reclamación de deuda — unpaid contributions', 'Providencia de apremio — the debt now has a surcharge and can be collected by force', 'Resolución de alta o baja — your registration as a worker or autónomo', 'Regularización de cuotas — your autónomo fee is adjusted to your real income'],
      tips: ['You can see your contributions and debts, and pay them, online in Import@ss with Cl@ve or a digital certificate.', 'Autónomos must get Social Security letters electronically. Check your notifications often.'],
    },
    {
      id: 'inss',
      slug: 'inss',
      name: 'Social Security benefits office',
      local: 'Instituto Nacional de la Seguridad Social (INSS)',
      about: 'Pays pensions, sick-leave and birth benefits, and the minimum income (ingreso mínimo vital).',
      patterns: [/instituto nacional de la seguridad social/i, /\bINSS\b/, /ingreso mínimo vital/i, /\bIMV\b/, /pensi[óo]n de (?:jubilaci[óo]n|viudedad|orfandad|incapacidad)/i, /incapacidad (?:temporal|permanente)/i, /nacimiento y cuidado de menor/i],
      letters: ['Resolución — a decision on your pension or benefit', 'Requerimiento — they need documents, for example for the ingreso mínimo vital', 'Citación a reconocimiento médico — a medical check, for example during sick leave', 'Cobro indebido — they want benefit money back'],
      tips: ['Before you can go to court about an INSS decision, you must first file a reclamación previa — usually within 30 days.'],
    },
    {
      id: 'sepe',
      slug: 'sepe',
      name: 'State employment service',
      local: 'Servicio Público de Empleo Estatal (SEPE)',
      about: 'Pays unemployment benefit (prestación por desempleo) and unemployment allowances (subsidios).',
      patterns: [/\bSEPE\b/, /servicio público de empleo estatal/i, /prestaci[óo]n (?:contributiva )?por desempleo/i, /subsidio por desempleo/i, /oficina de prestaciones/i, /demanda de empleo/i, /oficina de empleo/i],
      letters: ['Resolución de prestación — your benefit is approved or refused', 'Citación — you must come to an appointment', 'Cobro indebido — they want benefit money back', 'Suspensión o extinción — your payments are paused or stopped'],
      tips: ['Tell them about every change — a new job, even a short one, or a trip abroad. Otherwise you may have to pay money back.', 'Renew your job-seeker registration (renovación de la demanda) on the dates you are given, or your benefit can stop.'],
    },
    {
      id: 'extranjeria',
      slug: 'extranjeria',
      name: 'Immigration office',
      local: 'Oficina de Extranjería / Policía Nacional',
      about: 'Handles NIE numbers, residence permits and TIE cards for foreigners. Fingerprints and cards are done at Policía Nacional offices.',
      patterns: [/extranjer[íi]a/i, /oficina de extranjeros/i, /(?:sub)?delegación del gobierno/i, /tarjeta de identidad de extranjero/i, /\bTIE\b/, /autorizaci[óo]n de (?:residencia|estancia)/i, /\barraigo\b/i, /reagrupaci[óo]n familiar/i, /policía nacional/i, /toma de huellas/i, /certificado de registro de ciudadano/i],
      letters: ['Requerimiento de documentación — they need more papers for your application', 'Resolución favorable / concesión — your permit is approved; next you apply for the TIE card', 'Resolución denegatoria — your application is refused', 'Citación — an appointment, for example to check your documents'],
      tips: ['After your permit is approved, you usually must apply for your TIE card within one month. Book the fingerprint appointment (toma de huellas) quickly.', 'Keep the receipt (resguardo) of every application. It proves you applied in time.'],
    },
    {
      id: 'ayuntamiento',
      slug: 'ayuntamiento',
      name: 'Town hall',
      local: 'Ayuntamiento',
      about: 'Your local council. It handles address registration (padrón), local taxes like IBI and plusvalía, and local fines.',
      patterns: [/ayuntamiento/i, /\bajuntament\b/i, /\bconcello\b/i, /\budaletxea\b/i, /padr[óo]n municipal/i, /empadronamiento/i, /\bIBI\b/, /impuesto sobre bienes inmuebles/i, /plusval[íi]a/i, /incremento de valor de los terrenos/i, /tasa de (?:basuras|residuos)/i, /polic[íi]a (?:municipal|local)/i, /\bIVTM\b/, /impuesto sobre vehículos de tracción mecánica/i, /agencia tributaria (?:de )?madrid/i],
      letters: ['Recibo del IBI — the yearly property tax for owners', 'Liquidación de plusvalía — a tax when you sell or inherit a property', 'Multa municipal — a parking or traffic fine from the local police', 'Renovación del padrón — some foreigners must renew their address registration every 2 years'],
      tips: ['Registering your address (empadronamiento) is free. You need it for healthcare, school and many permits.', 'Non-EU citizens without long-term residence must renew their padrón registration every 2 years, or it is cancelled.'],
    },
    {
      id: 'dgt',
      slug: 'dgt',
      name: 'Traffic authority',
      local: 'Dirección General de Tráfico (DGT)',
      about: 'Handles driving licences, vehicle records and traffic fines on most roads.',
      patterns: [/dirección general de tráfico/i, /\bDGT\b/, /jefatura (?:provincial |local )?de tráfico/i, /permiso de conducci[óo]n/i, /permiso por puntos/i, /identificaci[óo]n del conductor/i, /tabl[óo]n edictal/i, /direcci[óo]n electr[óo]nica vial/i],
      letters: ['Notificación de denuncia — a traffic fine; you can pay with a discount or object', 'Requerimiento de identificación del conductor — they ask who was driving', 'Resolución sancionadora — the final decision on a fine'],
      tips: ['If they ask who was driving, you must answer in time — usually within 20 calendar days. Not answering is itself a serious fine.', 'Keep your address up to date with the DGT. Fines that can’t be delivered are published online (Tablón Edictal Único) and still count.'],
    },
    {
      id: 'recaudacion',
      slug: 'recaudacion-provincial',
      name: 'Local tax collection office',
      local: 'Organismo de recaudación / Diputación',
      about: 'Collects local taxes and fines for many town halls, for example IBI, car tax and parking fines.',
      patterns: [/organismo (?:autónomo )?(?:provincial )?de (?:gestión tributaria|recaudación)/i, /patronato (?:provincial )?de recaudación/i, /servicio (?:provincial )?de (?:gestión tributaria|recaudación)/i, /diputación (?:provincial|de)\b/i, /recaudación (?:provincial|ejecutiva|municipal)/i, /\bSUMA\b/, /\bORGT\b/, /\bOPAEF\b/],
      letters: ['Recibo / anuncio de cobranza — your yearly local taxes are due', 'Providencia de apremio — you paid late, so a surcharge is added', 'Diligencia de embargo — they are taking money from your account'],
      tips: ['Many local taxes have a fixed yearly payment period. Direct debit (domiciliación) helps you not miss it.', 'Check that the debt is really yours — for example car tax for a car you already sold.'],
    },
    {
      id: 'hacienda-autonomica',
      slug: 'agencia-tributaria-autonomica',
      name: 'Regional tax agency',
      local: 'Agencia tributaria autonómica',
      about: 'Your region’s tax office. It handles taxes on inheritances, gifts and property purchases (ITP). In the Basque Country and Navarra it also handles income tax.',
      patterns: [/ag[èe]ncia tribut[àa]ria (?:de catalunya|valenciana|canaria|de andaluc[íi]a|de las illes balears|de la regi[óo]n de murcia|de galicia)/i, /agència tributària/i, /\bATIB\b/, /hacienda (?:foral|tributaria de navarra)/i, /diputación foral/i, /dirección general de tributos/i, /consejería de (?:economía y )?hacienda/i, /impuesto sobre sucesiones/i, /transmisiones patrimoniales/i, /\bITP(?:AJD)?\b/, /actos jurídicos documentados/i],
      letters: ['Liquidación del ITP — tax after buying a used home, or a car from a private seller', 'Liquidación del impuesto sobre sucesiones — inheritance tax', 'Requerimiento — they ask for documents about a purchase or inheritance'],
      tips: ['After buying a used home, or a car from a private seller, you usually must file and pay the ITP within a set period (often one month). Check the rules of your region.'],
    },
    {
      id: 'juzgado',
      slug: 'juzgado',
      name: 'Court',
      local: 'Juzgado / Tribunal',
      about: 'A court. Court letters always matter — never ignore them, and get advice quickly.',
      patterns: [/juzgado/i, /\bjutjat\b/i, /audiencia provincial/i, /tribunal superior de justicia/i, /administraci[óo]n de justicia/i, /procedimiento monitorio/i, /juicio (?:verbal|ordinario|monitorio)/i, /c[ée]dula de (?:citaci[óo]n|emplazamiento|notificaci[óo]n|requerimiento)/i, /\bsentencia\b/i, /\bprocurador/i, /lexnet/i],
      letters: ['Requerimiento de pago (monitorio) — a court payment order; you usually have 20 working days to pay or oppose', 'Citación — you must appear in court', 'Sentencia — the judgment', 'Lanzamiento — the date of an eviction'],
      tips: ['Court deadlines are short and strict. In court cases, August usually doesn’t count as working days.', 'If your income is low, you can ask for free legal aid (justicia gratuita) at the bar association (Colegio de Abogados).'],
    },
    {
      id: 'dehu',
      slug: 'notificaciones-electronicas',
      name: 'Electronic notifications',
      local: 'Notificaciones electrónicas (DEHú / Carpeta Ciudadana)',
      about: 'The government website where official letters wait for you online. It isn’t the office that wrote the letter — open the letter to see who sent it.',
      weight: 0.5,
      patterns: [/\bDEH[úu]/i, /direcci[óo]n electr[óo]nica habilitada/i, /carpeta ciudadana/i, /notific@/i, /puesta a disposici[óo]n/i, /notificaci[óo]n electr[óo]nica/i],
      letters: ['Aviso de notificación — an email or text saying a new letter is waiting for you online', 'Notificación electrónica — the letter itself, opened online'],
      tips: ['An electronic letter counts as delivered when you open it — or 10 calendar days after it was made available, even if you never open it.', 'Companies must get letters electronically, and so must autónomos for Social Security. Check your notifications often.'],
    },
    {
      id: 'arrendador',
      slug: 'arrendador',
      name: 'Landlord or letting agency',
      local: 'Arrendador / inmobiliaria',
      about: 'The owner of your flat, or the agency that manages it.',
      patterns: [/arrendador/i, /arrendatari[oa]/i, /inmobiliaria/i, /contrato de (?:arrendamiento|alquiler)/i, /\bfianza\b/i, /\balquiler\b/i, /\bLAU\b/, /ley de arrendamientos urbanos/i, /actualizaci[óo]n de la renta/i],
      letters: ['Actualización de la renta — your rent changes, usually once a year', 'Preaviso de no renovación — your contract won’t be renewed', 'Requerimiento de pago / burofax — unpaid rent; often the step before an eviction case', 'Liquidación de la fianza — what happens with your deposit when you leave'],
      tips: ['For a main home, rental law usually lets tenants stay at least 5 years (7 if the landlord is a company), for contracts signed since March 2019.', 'Your deposit (fianza) is one month’s rent. The landlord must return it when you leave, minus proven damage or unpaid bills.'],
    },
    {
      id: 'suministros',
      slug: 'compania-suministros',
      name: 'Energy or water company',
      local: 'Compañía de luz, gas o agua',
      about: 'The company that sells you electricity, gas or water.',
      patterns: [/iberdrola/i, /endesa/i, /naturgy/i, /totalenergies/i, /holaluz/i, /octopus energy/i, /repsol (?:luz|electricidad|gas)/i, /canal de isabel ii/i, /comercializadora/i, /\bCUPS\b/, /\bkWh\b/i, /t[ée]rmino de (?:potencia|energ[íi]a)/i, /suministro (?:eléctrico|de gas|de agua)/i, /bono social/i],
      letters: ['Factura — your bill, usually every month or two', 'Requerimiento de pago / aviso de corte — unpaid bills; they may cut the supply', 'Cambio de condiciones — new prices or contract terms'],
      tips: ['If they warn about cutting your supply, call them right away and ask for a payment plan.', 'If your income is low, ask about the bono social. It lowers the bill and gives more protection from cuts.'],
    },
    {
      id: 'comunidad',
      slug: 'comunidad-de-propietarios',
      name: 'Owners’ association',
      local: 'Comunidad de propietarios',
      about: 'The association of all flat owners in a building. It shares costs like cleaning, lifts and repairs.',
      patterns: [/comunidad de propietarios/i, /administrador(?:a)? de fincas/i, /junta (?:general )?(?:ordinaria|extraordinaria|de propietarios)/i, /\bderrama/i, /cuotas? de (?:la )?comunidad/i, /propiedad horizontal/i],
      letters: ['Convocatoria de junta — invitation to the owners’ meeting', 'Acta de la junta — the minutes of the meeting', 'Derrama — an extra payment, for example for repairs', 'Reclamación de cuotas — unpaid community fees'],
      tips: ['If you own a flat, meeting decisions bind you even if you didn’t go. Read the minutes (acta) you receive.', 'If you rent, community fees are paid by the owner unless your contract says otherwise.'],
    },
    {
      id: 'recobro',
      slug: 'recobro',
      name: 'Bank or debt collector',
      local: 'Banco / empresa de recobro',
      about: 'Your bank, or a company that collects debts for others. Check that the debt is real before you pay.',
      patterns: [/recobro/i, /gesti[óo]n de (?:cobro|impagados)/i, /\bintrum\b/i, /\blindorff\b/i, /\bhoist\b/i, /fichero de (?:morosos|solvencia)/i, /\bASNEF\b/, /\bbadexcug\b/i, /entidad acreedora/i, /cesi[óo]n (?:del crédito|de la deuda)/i],
      letters: ['Requerimiento de pago — they ask you to pay a debt plus costs', 'Aviso de inclusión en fichero de morosos — a warning that you may be added to a list of people who owe money'],
      tips: ['Ask for proof of the debt (contract and invoices) if you don’t recognise it. Very old debts may have expired.', 'Debt collectors must not harass you or tell other people, like your employer or neighbours, about your debt.'],
    },
  ],
  kinds: [
    {
      id: 'apremio', type: 'enforcement', local: 'Providencia de apremio', name: 'Enforced collection notice', about: 'You didn’t pay in time. A surcharge is now added, and if you still don’t pay they can take the money from your bank account, wages or property.', urgency: 'high', extendable: false, patterns: [/apremio/i, /recargo ejecutivo/i],
      steps: ['Pay the full amount by the date in the letter. For tax debts, this usually keeps the surcharge at 10% instead of 20%.'],
    },
    {
      id: 'embargo', type: 'enforcement', local: 'Diligencia de embargo', name: 'Seizure notice', about: 'They are taking money or property to pay a debt — for example from your bank account, wages or a tax refund.', urgency: 'high', extendable: false, patterns: [/diligencia de embargo/i, /embarg/i],
      steps: ['By law, wages and pensions up to the minimum wage (SMI) can’t be seized, and only part of the rest. If they took too much, tell them right away and send proof.'],
    },
    {
      id: 'monitorio', type: 'court-order', local: 'Requerimiento de pago (procedimiento monitorio)', name: 'Court payment order', about: 'A court orders you to pay a debt. You usually have 20 working days to pay or to oppose it. If you do nothing, they can take the money by force.', urgency: 'high', objection: false, patterns: [/monitorio/i, /escrito de oposici[óo]n/i],
      steps: ['If you really owe the money, pay it within the deadline and keep proof.', 'If you don’t owe it, file a written opposition (oposición) with the court within the deadline. For amounts over 2,000 € you need a lawyer and a court agent (procurador). If your income is low, ask for free legal aid (justicia gratuita).'],
    },
    {
      id: 'reintegro', type: 'repayment', local: 'Reintegro / cobro indebido', name: 'Request to pay money back', about: 'They believe you got money you weren’t entitled to, for example unemployment benefit, and want it back.', urgency: 'high', patterns: [/reintegro/i, /reintegrar/i, /cobro indebido/i, /percepci[óo]n indebida/i, /indebidamente percibid/i, /devoluci[óo]n de lo percibido/i, /debe devolver/i],
      steps: ['Check the period and the amount. If you think it’s wrong, reply in writing before the deadline in the letter.'],
    },
    {
      id: 'sancion', type: 'fine', local: 'Multa / sanción', name: 'Fine', about: 'An official fine, for example for a traffic or parking offence. You can usually pay with a discount or object — not both.', urgency: 'high', extendable: false, patterns: [/\bmulta/i, /sanci[óo]n/i, /sancionador/i, /boletín de denuncia/i, /notificaci[óo]n de (?:la )?denuncia/i, /infracci[óo]n/i],
      steps: ['Check the details: date, place, number plate and the rule they say you broke.', 'For most traffic fines, paying within 20 calendar days (días naturales) gives you 50% off. But then you can’t object any more, and you still lose any licence points.', 'If you think the fine is wrong, send alegaciones before the deadline in the letter instead of paying.'],
    },
    { id: 'reclamacion', type: 'reminder', local: 'Reclamación de deuda / burofax', name: 'Payment demand', about: 'Someone says you owe money and asks you to pay. If you ignore it, the next step can be a court case or a list of people who owe money (fichero de morosos).', urgency: 'high', patterns: [/reclamaci[óo]n de (?:deuda|pago|cantidad|cuotas)/i, /requerimiento de pago/i, /burofax/i, /deuda pendiente/i, /importe pendiente/i, /recibos? (?:pendientes?|impagados?|devueltos?)/i, /impago/i, /recordatorio de pago/i, /no (?:hemos recibido|consta) (?:el|su) pago/i, /fichero de morosos/i] },
    {
      id: 'propuesta', type: 'hearing', local: 'Propuesta / trámite de alegaciones', name: 'Proposal — chance to explain', about: 'A draft decision, not the final one. You can reply with your arguments and proof (alegaciones) before they decide.', urgency: 'medium', patterns: [/propuesta de (?:liquidaci[óo]n|resoluci[óo]n|sanci[óo]n)/i, /tr[áa]mite de (?:alegaciones|audiencia)/i, /(?:formular|presentar) alegaciones/i],
      steps: ['Check the figures and the facts. If you disagree, send alegaciones with proof before the deadline — usually 10 to 15 working days. If you agree, you usually don’t need to reply; the final decision will follow.'],
    },
    {
      id: 'citacion', type: 'appointment', local: 'Citación / cita', name: 'Appointment', about: 'They want you to come in person on a set date. Missing it without a good reason can delay or harm your case — or cut your unemployment benefit.', urgency: 'medium', objection: false, patterns: [/citaci[óo]n/i, /\bcitad[oa]\b/i, /\bcita\b(?! previa)/i, /le citamos/i, /comparec/i, /deber[áa] (?:acudir|personarse)/i, /entrevista/i, /reconocimiento médico/i],
      steps: ['Bring your passport or TIE card and every document they ask for. Arrive a little early.'],
    },
    {
      id: 'requerimiento', type: 'documents', local: 'Requerimiento de documentación', name: 'Request for documents', about: 'They need papers or information from you. If you don’t answer in time, they may close your application or decide without your papers.', urgency: 'medium', objection: false, patterns: [/requerimiento(?! de (?:pago|desalojo))/i, /le requerimos/i, /subsan/i, /(?:deberá|debe) aportar/i, /aporte (?:la siguiente|los siguientes)/i, /documentaci[óo]n requerida/i, /se le tendrá por desistid/i],
      steps: ['Send exactly what they ask for before the deadline — often 10 working days. If you can’t get a document in time, send what you have and ask for more time (ampliación de plazo) before the deadline ends.', 'For tax letters, ignoring a requerimiento can lead to a fine.'],
    },
    {
      id: 'denegacion', type: 'rejection', local: 'Resolución denegatoria', name: 'Rejection', about: 'Your application was turned down. You can usually appeal — the end of the letter says how and by when.', urgency: 'medium', patterns: [/denegatori[ao]/i, /se deniega/i, /denegar/i, /denegad[oa]/i, /desestim/i, /inadmisi[óo]n/i],
      steps: ['Read the end of the letter (pie de recurso). It says which appeal you can file — for example recurso de reposición or recurso de alzada — and the deadline, often one month.'],
    },
    {
      id: 'liquidacion', type: 'tax-assessment', local: 'Liquidación provisional', name: 'Tax assessment', about: 'The tax office checked your tax and set the amount. You may have to pay more — or get money back.', urgency: 'medium', extendable: false, patterns: [/(?<!propuesta de )liquidaci[óo]n provisional/i, /notificaci[óo]n de (?:la )?liquidaci[óo]n/i, /acuerdo de liquidaci[óo]n/i, /liquidaci[óo]n (?:definitiva|complementaria|del impuesto)/i],
      steps: ['If you disagree, you can file a recurso de reposición with the same office or a reclamación económico-administrativa with the tax tribunal (TEA) — not both. The deadline is usually one month.', 'An appeal doesn’t stop the payment deadline. To pause the payment, you must ask for it, usually with a guarantee.'],
    },
    {
      id: 'concesion', type: 'approval', local: 'Resolución estimatoria / concesión', name: 'Approval', about: 'Your application was approved. The letter shows what you get, from when and for how long.', urgency: 'low', patterns: [/estimatori[ao]/i, /concesi[óo]n/i, /se (?:le )?concede (?:la|el)/i, /se (?:le )?reconoce el derecho/i, /resoluci[óo]n favorable/i, /resolver favorablemente/i],
      steps: ['If this is a residence permit, book your fingerprint appointment (toma de huellas) for the TIE card soon — usually you must apply within one month.'],
    },
    {
      id: 'fin-contrato', type: 'termination', local: 'Desahucio / resolución de contrato', name: 'Termination or eviction notice', about: 'Someone is ending a contract — for example your rental contract, your job or a service. Eviction (desahucio) and dismissal (despido) letters have short deadlines.', urgency: 'high', objection: false, patterns: [/desahucio/i, /lanzamiento/i, /desalojo/i, /resoluci[óo]n del contrato/i, /rescisi[óo]n del contrato/i, /no renovaci[óo]n/i, /(?:extinci[óo]n|finalizaci[óo]n) del contrato/i, /despido/i, /preaviso/i],
      steps: ['If this is about your flat, get advice before you leave or sign anything. For a main home, rental law often protects tenants for a minimum period.', 'If you were dismissed (despido), you usually have only 20 working days to challenge it. Contact a union or a labour lawyer right away.'],
    },
    {
      id: 'factura-suministro', type: 'utility-bill', local: 'Factura de luz, gas o agua', name: 'Energy or water bill', about: 'A bill for electricity, gas or water. Check the period, the meter readings and whether the reading was estimated (lectura estimada).', urgency: 'medium', patterns: [/t[ée]rmino de (?:potencia|energ[íi]a)/i, /\bCUPS\b/, /\bkWh\b/i, /lectura (?:real|estimada)/i, /factura de (?:la )?(?:luz|electricidad|gas|agua)/i, /consumo de (?:electricidad|gas|agua)/i],
      steps: ['If the reading was estimated (lectura estimada), send your own meter reading to get a correct bill.', 'If you can’t pay, call the company before the due date. If your income is low, ask about the bono social.'],
    },
    { id: 'recibo', type: 'bill', local: 'Carta de pago / recibo', name: 'Bill', about: 'A bill or payment form. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/carta de pago/i, /\brecibo\b/i, /\bfactura\b/i, /documento de (?:ingreso|pago)/i, /importe a pagar/i] },
    { id: 'resolucion', type: 'decision', local: 'Resolución', name: 'Official decision', about: 'A formal decision by a public office. It becomes final if you don’t appeal in time — the end of the letter (pie de recurso) says how.', urgency: 'medium', weight: 0.4, patterns: [/resoluci[óo]n/i, /\bresuelv[eo]\b/i] },
  ],
  references: [
    { name: 'Case number', local: 'Número de expediente', pattern: /(?:n[úu]mero de expediente|n[º°]\s?(?:de\s)?expediente|\bexpediente\b|\bexpte\.)/gi },
    { name: 'Fine number', local: 'Número de boletín de denuncia', pattern: /(?:(?:n[úu]mero|n[º°])\s?(?:del?\s)?(?:boletín(?: de denuncia)?|denuncia)|boletín de denuncia)/gi },
    { name: 'Contract number', local: 'Número de contrato', pattern: /(?:n[úu]mero de contrato|n[º°]\s?(?:de\s)?contrato|contrato n[º°])/gi },
    { name: 'Foreigner’s identity number', local: 'NIE', pattern: /(?:\bNIE\b|\bN\.I\.E\.|n[úu]mero de identidad de extranjero)/gi },
    { name: 'Tax number', local: 'NIF', pattern: /(?:\bNIF\b|\bN\.I\.F\.|n[úu]mero de identificaci[óo]n fiscal)/gi },
    { name: 'Social Security number', local: 'NSS', personal: true, pattern: /(?:n[úu]mero de (?:la )?seguridad social|n[úu]mero de afiliaci[óo]n|\bNAF\b|\bNUSS\b|\bNSS\b)/gi },
    { name: 'Tax assessment number', local: 'Clave de liquidación', pattern: /(?:clave de liquidaci[óo]n|n[úu]mero de liquidaci[óo]n|n[º°]\s?(?:de\s)?liquidaci[óo]n)/gi },
    { name: 'Reference number', local: 'Número de referencia', pattern: /(?:n[úu]mero de referencia|n[º°]\s?(?:de\s)?referencia|\bsu referencia\b|\bnuestra referencia\b)/gi },
    { name: 'Supply point code', local: 'CUPS', pattern: /(?:\bCUPS\b|c[óo]digo universal (?:del|de) punto de suministro)/gi },
    { name: 'Secure verification code', local: 'CSV', pattern: /(?:c[óo]digo seguro de verificaci[óo]n(?:\s*\(CSV\))?|\bCSV\b)/gi },
    { name: 'Payment form number', local: 'Número de justificante', payment: true, pattern: /(?:n[úu]mero de justificante|n[º°]\s?(?:de\s)?justificante)/gi },
    { name: 'Payment reference', local: 'Concepto', payment: true, pattern: /(?:\bconcepto\b(?=\s*:)|referencia (?:de|para el) pago)/gi },
  ],
  glossary: [
    { term: 'NIE', slug: 'nie', pattern: /\bNIE\b|identidad de extranjero/i, meaning: 'Foreigner’s identity number. It starts with X, Y or Z and is also your tax number (NIF).', tip: 'Write it on every form and reply. Offices find your file by it.' },
    { term: 'NIF', slug: 'nif', pattern: /\bNIF\b/, meaning: 'Tax identity number. For foreigners it is the same as the NIE.' },
    { term: 'DNI', slug: 'dni', pattern: /\bDNI\b/, meaning: 'Spanish national identity card and number. Only Spanish citizens have one.' },
    { term: 'TIE', slug: 'tie', pattern: /\bTIE\b|tarjeta de identidad de extranjero/i, meaning: 'Foreigner’s identity card with your photo. It proves your residence permit.', tip: 'Book the fingerprint appointment (toma de huellas) soon after your permit is approved — usually you must apply within one month.' },
    { term: 'Empadronamiento', slug: 'empadronamiento', pattern: /empadrona/i, meaning: 'Registering your address at the town hall. You need it for healthcare, school and many permits.', tip: 'Non-EU citizens without long-term residence must renew it every 2 years, or it is cancelled.' },
    { term: 'Padrón', slug: 'padron', pattern: /\bpadr[óo]n\b/i, meaning: 'The town hall’s list of residents. A certificado de empadronamiento proves where you live.' },
    { term: 'Hacienda', slug: 'hacienda', pattern: /\bhacienda\b/i, meaning: 'Everyday name for the tax office (Agencia Tributaria).' },
    { term: 'IRPF', slug: 'irpf', pattern: /\bIRPF\b|impuesto sobre la renta de las personas/i, meaning: 'Personal income tax. The yearly tax return (declaración de la renta) is usually filed from April to June.' },
    { term: 'Modelo', slug: 'modelo', pattern: /\bmodelo \d{3}\b/i, meaning: 'A numbered tax form, for example modelo 100 (income tax) or modelo 303 (VAT).' },
    { term: 'Liquidación', slug: 'liquidacion', pattern: /liquidaci[óo]n/i, meaning: 'Calculation of an amount you must pay, often a tax assessment.' },
    { term: 'Propuesta de liquidación', slug: 'propuesta-de-liquidacion', pattern: /propuesta de liquidaci[óo]n/i, meaning: 'A draft tax assessment. It isn’t final — you can reply with alegaciones first.' },
    { term: 'Requerimiento', slug: 'requerimiento', pattern: /requerimiento/i, meaning: 'Formal request to send documents, give information or pay.', tip: 'Answer in time, even if only to ask for more time. Ignoring it can lead to a fine or a decision against you.' },
    { term: 'Notificación', slug: 'notificacion', pattern: /notificaci[óo]n/i, meaning: 'Official delivery of a letter. Most deadlines start the day after.' },
    { term: 'Plazo', slug: 'plazo', pattern: /\bplazo/i, meaning: 'Deadline or time limit.', tip: 'Check whether it says días hábiles (working days) or días naturales (calendar days).' },
    { term: 'Días hábiles', slug: 'dias-habiles', pattern: /d[íi]as h[áa]biles/i, meaning: 'Working days. Saturdays, Sundays and public holidays don’t count.' },
    { term: 'Días naturales', slug: 'dias-naturales', pattern: /d[íi]as naturales/i, meaning: 'Calendar days. Every day counts, including weekends.' },
    { term: 'Recurso de reposición', slug: 'recurso-de-reposicion', pattern: /recurso (?:potestativo )?de reposici[óo]n/i, meaning: 'Appeal to the same office that made the decision. Usually within one month.', tip: 'Say clearly why the decision is wrong and add proof. You can file it online in the office’s sede electrónica or at any public registry office.' },
    { term: 'Recurso de alzada', slug: 'recurso-de-alzada', pattern: /recurso de alzada/i, meaning: 'Appeal to a higher office. Usually within one month.' },
    { term: 'Reclamación económico-administrativa', slug: 'reclamacion-economico-administrativa', pattern: /reclamaci[óo]n econ[óo]mico[- ]administrativa/i, meaning: 'Appeal against a tax decision to a special tax tribunal (TEA). Usually within one month.' },
    { term: 'Reclamación previa', slug: 'reclamacion-previa', pattern: /reclamaci[óo]n (?:administrativa )?previa/i, meaning: 'A first complaint to the office, for example Social Security, that you must file before you can go to court.' },
    { term: 'Alegaciones', slug: 'alegaciones', pattern: /alegaci[óo]n/i, meaning: 'Your written arguments and proof, sent before the office makes its final decision.', tip: 'Send them before the deadline, with copies of your proof. Keep the receipt (justificante de registro).' },
    { term: 'Resolución', slug: 'resolucion', pattern: /resoluci[óo]n/i, meaning: 'Official decision.' },
    { term: 'Desistimiento', slug: 'desistimiento', pattern: /desist/i, meaning: 'Your application is treated as withdrawn, for example because you didn’t send missing papers in time.' },
    { term: 'Apremio', slug: 'apremio', pattern: /apremio/i, meaning: 'Enforced collection. You didn’t pay in time, so a surcharge is added.', tip: 'Pay by the date in the letter. For tax debts, this usually keeps the surcharge at 10% instead of 20%.' },
    { term: 'Recargo', slug: 'recargo', pattern: /recargo/i, meaning: 'Surcharge. Extra money added because you paid late.' },
    { term: 'Embargo', slug: 'embargo', pattern: /embarg/i, meaning: 'Seizure of money or property to pay a debt, for example from your bank account or wages.', tip: 'Wages and pensions up to the minimum wage (SMI) are protected by law. If too much was taken, tell them and send proof.' },
    { term: 'Aplazamiento', slug: 'aplazamiento', pattern: /aplazamiento/i, meaning: 'Permission to pay later.' },
    { term: 'Fraccionamiento', slug: 'fraccionamiento', pattern: /fraccionamiento/i, meaning: 'Permission to pay in instalments.', tip: 'Ask before the payment deadline ends. For tax debts you can apply online in the sede electrónica.' },
    { term: 'Domiciliación', slug: 'domiciliacion', pattern: /domiciliaci[óo]n|domiciliad/i, meaning: 'Direct debit. The money is taken from your bank account automatically.' },
    { term: 'Carta de pago', slug: 'carta-de-pago', pattern: /carta de pago|documento de ingreso/i, meaning: 'Payment form. Take it to a bank or use its number to pay online.' },
    { term: 'Certificado digital', slug: 'certificado-digital', pattern: /certificado (?:digital|electr[óo]nico)/i, meaning: 'A digital ID on your computer or phone. You use it to sign in and sign documents online.', tip: 'You can get one free from the FNMT. You must confirm your identity once, usually in person.' },
    { term: 'Cl@ve', slug: 'clave', pattern: /cl@ve/i, meaning: 'The government’s login system. You sign in with a PIN, a permanent password or the Cl@ve app.' },
    { term: 'Sede electrónica', slug: 'sede-electronica', pattern: /sede electr[óo]nica/i, meaning: 'An office’s official website for online forms, payments and letters.' },
    { term: 'Cita previa', slug: 'cita-previa', pattern: /cita previa/i, meaning: 'An appointment you book in advance. Many offices won’t see you without one.' },
    { term: 'Multa', slug: 'multa', pattern: /\bmulta/i, meaning: 'Fine.' },
    { term: 'Sanción', slug: 'sancion', pattern: /sanci[óo]n|sancionador/i, meaning: 'Penalty, often a fine.' },
    { term: 'Denuncia', slug: 'denuncia', pattern: /\bdenuncia/i, meaning: 'In traffic letters, the report of an offence that starts a fine. It can also mean a police report.' },
    { term: 'IBI', slug: 'ibi', pattern: /\bIBI\b|impuesto sobre bienes inmuebles/i, meaning: 'Yearly property tax, paid to the town hall by the owner.' },
    { term: 'Plusvalía', slug: 'plusvalia', pattern: /plusval[íi]a|incremento de valor de los terrenos/i, meaning: 'Town hall tax when a property is sold, given away or inherited.' },
    { term: 'IVA', slug: 'iva', pattern: /\bIVA\b/, meaning: 'Value-added tax (VAT). The standard rate is 21%.' },
    { term: 'Autónomo', slug: 'autonomo', pattern: /trabajador(?:es|a|as)? aut[óo]nom[oa]s?|\bcomo aut[óo]nom[oa]\b|cuota de aut[óo]nomos|\bRETA\b/i, meaning: 'Self-employed person. Autónomos pay a monthly Social Security fee (cuota) based on their income.' },
    { term: 'Cuota', slug: 'cuota', pattern: /\bcuota/i, meaning: 'A set amount to pay, for example the monthly Social Security fee. In tax letters it means the tax amount.' },
    { term: 'SEPE', slug: 'sepe', pattern: /\bSEPE\b/, meaning: 'The state employment service. It pays unemployment benefit.' },
    { term: 'Prestación', slug: 'prestacion', pattern: /prestaci[óo]n/i, meaning: 'Benefit — money from the state, for example unemployment benefit.' },
    { term: 'Subsidio', slug: 'subsidio', pattern: /subsidio/i, meaning: 'A smaller benefit, for example after your unemployment benefit has ended.' },
    { term: 'Cobro indebido', slug: 'cobro-indebido', pattern: /cobro indebido|percepci[óo]n indebida|indebidamente percibid/i, meaning: 'Money you got but weren’t entitled to. They will ask for it back.' },
    { term: 'Burofax', slug: 'burofax', pattern: /burofax/i, meaning: 'A letter sent with proof of content and delivery. It is often the step before a court case.', tip: 'Don’t ignore a burofax. It can be used as evidence in court.' },
    { term: 'Fianza', slug: 'fianza', pattern: /\bfianza/i, meaning: 'Rental deposit. For a home it is one month’s rent.' },
    { term: 'CSV', slug: 'csv', pattern: /c[óo]digo seguro de verificaci[óo]n|\bCSV\b/i, meaning: 'Secure verification code. You can use it online to check that a document is genuine.' },
    { term: 'Justicia gratuita', slug: 'justicia-gratuita', pattern: /justicia gratuita/i, meaning: 'Free legal aid for people with a low income.' },
  ],
  replies: {
    objection: {
      subject: (term, of) => `Asunto: ${capitalize(term)} contra su resolución ${of}`,
      body: (term, of) => [
        `Por medio del presente escrito interpongo ${term} contra su resolución ${of}.`,
        '',
        'Motivos: [Explique en pocas frases por qué la resolución es incorrecta.]',
        '',
        'Solicito que se anule o se modifique la resolución y que se me confirme la recepción de este escrito.',
      ],
    },
  },
  extraReplies: [
    {
      id: 'alegaciones',
      title: 'Explain your side first (alegaciones)',
      advice: 'Use this to reply to a proposal before the final decision. Send it before the deadline, online or at a public registry office, and add copies of your proof.',
      english: 'About your letter dated [date]: I disagree because [your reason]. I attach [documents]. Please take this into account before you decide, and confirm that you received this letter.',
      subject: 'Asunto: Alegaciones',
      body: (result) => alegacionesBody(letterOf(result)),
      when: (result) => result.kind?.type === 'hearing' || result.objection === 'alegaciones',
      replaces: 'objection',
    },
    {
      id: 'send-documents',
      title: 'Send the documents they asked for (aportación de documentación)',
      advice: 'Use this as a cover letter when you send the papers. List every document, keep copies, and keep the receipt (justificante de registro).',
      english: 'In reply to your letter dated [date], I am sending the documents you asked for: [list]. Please confirm that you received them.',
      subject: 'Asunto: Aportación de documentación',
      body: (result) => [
        `En respuesta a su requerimiento ${letterOf(result)}, adjunto la siguiente documentación:`,
        '- [Documento 1]',
        '- [Documento 2]',
        '- [Documento 3]',
        '',
        'Les ruego que me confirmen la recepción de este escrito y de los documentos.',
      ],
      when: (result) => result.kind?.type === 'documents',
    },
  ],
  samples: [
    {
      id: 'tax',
      title: 'Tax agency',
      subtitle: 'Tax assessment with a payment date',
      build(today) {
        const letter = addDays(today, -5);
        const year = Number(today.slice(0, 4)) - 1;
        const due = voluntaryPaymentEnd(addDays(letter, 3));
        return `Agencia Tributaria
Delegación Especial de Madrid
Calle del Ejemplo 10 · 28004 Madrid

Sr. Thomas Sample
Calle de la Muestra 25, 3.º B
28012 Madrid

NIF: X1234567L
Número de expediente: 2026GRC28012345
Clave de liquidación: A2860026506000123
Fecha: ${fmt(letter)}

Notificación de liquidación provisional
Impuesto sobre la Renta de las Personas Físicas (IRPF) · Ejercicio ${year}

Estimado Sr. Sample:

La Agencia Tributaria ha comprobado su declaración del IRPF del ejercicio ${year} y ha dictado la siguiente liquidación provisional. En su declaración no figuraban los ingresos por el alquiler de una vivienda.

Cuota resultante de la comprobación: 1.180,40 €
Intereses de demora: 54,16 €
Importe total a ingresar: 1.234,56 €

Plazo de ingreso en periodo voluntario: hasta el ${fmt(due)}.

Forma de pago
Puede pagar con la carta de pago adjunta en cualquier entidad colaboradora (bancos y cajas de ahorros) o en la Sede electrónica (sede.agenciatributaria.gob.es). Si reside en el extranjero y no tiene cuenta en una entidad colaboradora, puede pagar por transferencia:
Beneficiario: Agencia Estatal de Administración Tributaria
IBAN: ES91 2100 0418 4502 0005 1332
BIC: CAIXESBBXXX
Concepto: 0212345678901

Si no paga en plazo, la deuda pasará al periodo ejecutivo y se exigirá con recargos e intereses. Si no puede pagar de una vez, puede solicitar un aplazamiento o fraccionamiento antes de que termine el plazo de ingreso.

Recursos
Contra esta liquidación puede interponer recurso de reposición ante esta oficina o reclamación económico-administrativa ante el Tribunal Económico-Administrativo Regional de Madrid, en el plazo de un mes contado a partir del día siguiente al de la notificación. No puede presentar ambos a la vez. La presentación de un recurso no suspende el plazo de ingreso.

Código Seguro de Verificación (CSV): ABCD1234EFGH5678

Atentamente,
La Jefa de la Dependencia de Gestión Tributaria`;
      },
    },
    {
      id: 'extranjeria',
      title: 'Immigration office',
      subtitle: 'Appointment letter',
      build(today) {
        const letter = addDays(today, -4);
        const appointment = nextWorkday(addDays(today, 8));
        return `Subdelegación del Gobierno en Málaga
Oficina de Extranjería
Calle del Ejemplo 7 · 29001 Málaga

Sra. Emily Example
Calle de la Prueba 8, 2.º A
29002 Málaga

NIE: Y7654321G
Número de expediente: 290020260012345
Fecha: ${fmt(letter)}

Citación para comparecencia personal

Estimada Sra. Example:

En relación con su solicitud de autorización de residencia temporal, le comunicamos que debe comparecer personalmente en esta Oficina de Extranjería el ${fmt(appointment)} a las 9:30, en la ventanilla 4.

Motivo de la citación: comprobar los documentos originales de su solicitud.

Debe traer:
- esta citación
- su pasaporte en vigor
- los originales de los documentos que presentó con la solicitud

Si no puede acudir, comuníquelo antes de la fecha de la cita a través de la Sede electrónica (sede.administracionespublicas.gob.es), indicando su número de expediente.

Si no comparece y no justifica el motivo, se le podrá declarar decaída en su derecho a este trámite (artículo 73.3 de la Ley 39/2015).

Atentamente,
La Jefa de la Oficina de Extranjería`;
      },
    },
  ],
};
